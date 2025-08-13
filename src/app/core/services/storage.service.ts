import { Injectable, signal } from '@angular/core';

export interface TimerPreferences {
  audioEnabled: boolean;
  volume: number;
  theme: 'light' | 'dark' | 'auto';
  defaultStopwatchFormat: 'mm:ss.cc' | 'hh:mm:ss';
  showMilliseconds: boolean;
  autoStartLaps: boolean;
  confirmReset: boolean;
  fullScreenMode: boolean;
  favoritePresets: number[];
  adsDisabled: boolean;
}

export interface TimerHistoryEntry {
  id: string;
  type:
    | 'stopwatch'
    | 'countdown'
    | 'interval'
    | 'egg-timer'
    | 'bomb-timer'
    | 'meditation-timer'
    | 'pomodoro'
    | 'basketball-timer'
    | 'hockey-timer'
    | 'presentation-timer';
  duration: number;
  timestamp: Date;
  completed: boolean;
  laps?: number[];
  name?: string;
}

export interface UserStats {
  totalSessions: number;
  totalTimeSpent: number;
  favoriteTimerType: string;
  averageSessionLength: number;
  streak: number;
  lastUsed: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly PREFERENCES_KEY = 'timer-preferences';
  private readonly HISTORY_KEY = 'timer-history';
  private readonly STATS_KEY = 'user-stats';
  private readonly MAX_HISTORY_ENTRIES = 100;

  private readonly _preferences = signal<TimerPreferences>(this.getDefaultPreferences());
  private readonly _history = signal<TimerHistoryEntry[]>([]);
  private readonly _stats = signal<UserStats>(this.getDefaultStats());

  readonly preferences = this._preferences.asReadonly();
  readonly history = this._history.asReadonly();
  readonly stats = this._stats.asReadonly();

  constructor() {
    if (this.isBrowser()) {
      this.loadPreferences();
      this.loadHistory();
      this.loadStats();
    }
  }

  // Check if running in browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Preferences management
  updatePreferences(preferences: Partial<TimerPreferences>): void {
    this._preferences.update(current => {
      const updated = { ...current, ...preferences };
      this.savePreferences(updated);
      return updated;
    });
  }

  resetPreferences(): void {
    const defaults = this.getDefaultPreferences();
    this._preferences.set(defaults);
    this.savePreferences(defaults);
  }

  private getDefaultPreferences(): TimerPreferences {
    return {
      audioEnabled: true,
      volume: 0.7,
      theme: 'auto',
      defaultStopwatchFormat: 'mm:ss.cc',
      showMilliseconds: true,
      autoStartLaps: false,
      confirmReset: true,
      fullScreenMode: false,
      favoritePresets: [60000, 300000, 600000, 1500000], // 1min, 5min, 10min, 25min
      adsDisabled: true
    };
  }

  private loadPreferences(): void {
    if (!this.isBrowser()) return;
    
    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this._preferences.set({ ...this.getDefaultPreferences(), ...parsed });
      }
    } catch (error) {
      console.warn('Error loading preferences:', error);
    }
  }

  private savePreferences(preferences: TimerPreferences): void {
    if (!this.isBrowser()) return;
    
    try {
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Error saving preferences:', error);
    }
  }

  // History management
  addHistoryEntry(entry: Omit<TimerHistoryEntry, 'id' | 'timestamp'>): void {
    const newEntry: TimerHistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date()
    };

    this._history.update(current => {
      const updated = [newEntry, ...current].slice(0, this.MAX_HISTORY_ENTRIES);
      this.saveHistory(updated);
      return updated;
    });

    this.updateStats(newEntry);
  }

  deleteHistoryEntry(id: string): void {
    this._history.update(current => {
      const updated = current.filter(entry => entry.id !== id);
      this.saveHistory(updated);
      return updated;
    });
  }

  clearHistory(): void {
    this._history.set([]);
    this.saveHistory([]);
  }

  getRecentHistory(limit: number = 10): TimerHistoryEntry[] {
    return this._history().slice(0, limit);
  }

  getHistoryByType(type: TimerHistoryEntry['type']): TimerHistoryEntry[] {
    return this._history().filter(entry => entry.type === type);
  }

  private loadHistory(): void {
    if (!this.isBrowser()) return;
    
    try {
      const stored = localStorage.getItem(this.HISTORY_KEY);
      if (stored) {
        const parsed: TimerHistoryEntry[] = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map(entry => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        this._history.set(withDates);
      }
    } catch (error) {
      console.warn('Error loading history:', error);
    }
  }

  private saveHistory(history: TimerHistoryEntry[]): void {
    if (!this.isBrowser()) return;
    
    try {
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Error saving history:', error);
    }
  }

  // Stats management
  private updateStats(entry: TimerHistoryEntry): void {
    this._stats.update(current => {
      const updated: UserStats = {
        ...current,
        totalSessions: current.totalSessions + 1,
        totalTimeSpent: current.totalTimeSpent + entry.duration,
        lastUsed: new Date()
      };

      // Update favorite timer type
      const typeCounts = this.getTimerTypeCounts();
      updated.favoriteTimerType = Object.entries(typeCounts)
        .reduce((a, b) => typeCounts[a[0]] > typeCounts[b[0]] ? a : b)[0];

      // Calculate average session length
      updated.averageSessionLength = updated.totalTimeSpent / updated.totalSessions;

      // Update streak (consecutive days of usage)
      updated.streak = this.calculateStreak();

      this.saveStats(updated);
      return updated;
    });
  }

  private getTimerTypeCounts(): Record<string, number> {
    return this._history().reduce((counts, entry) => {
      counts[entry.type] = (counts[entry.type] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private calculateStreak(): number {
    const history = this._history();
    if (history.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);

    for (let i = 0; i < 365; i++) { // Check up to a year
      const hasUsage = history.some(entry => {
        const entryDate = new Date(entry.timestamp);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === currentDate.getTime();
      });

      if (hasUsage) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  private getDefaultStats(): UserStats {
    return {
      totalSessions: 0,
      totalTimeSpent: 0,
      favoriteTimerType: 'stopwatch',
      averageSessionLength: 0,
      streak: 0,
      lastUsed: new Date()
    };
  }

  private loadStats(): void {
    if (!this.isBrowser()) return;
    
    try {
      const stored = localStorage.getItem(this.STATS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this._stats.set({
          ...this.getDefaultStats(),
          ...parsed,
          lastUsed: new Date(parsed.lastUsed)
        });
      }
    } catch (error) {
      console.warn('Error loading stats:', error);
    }
  }

  private saveStats(stats: UserStats): void {
    if (!this.isBrowser()) return;
    
    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.warn('Error saving stats:', error);
    }
  }

  resetStats(): void {
    const defaults = this.getDefaultStats();
    this._stats.set(defaults);
    this.saveStats(defaults);
  }

  // Preset management
  addFavoritePreset(milliseconds: number): void {
    this._preferences.update(current => {
      const updated = {
        ...current,
        favoritePresets: [...current.favoritePresets, milliseconds]
          .filter((value, index, array) => array.indexOf(value) === index) // Remove duplicates
          .sort((a, b) => a - b) // Sort by duration
      };
      this.savePreferences(updated);
      return updated;
    });
  }

  removeFavoritePreset(milliseconds: number): void {
    this._preferences.update(current => {
      const updated = {
        ...current,
        favoritePresets: current.favoritePresets.filter(preset => preset !== milliseconds)
      };
      this.savePreferences(updated);
      return updated;
    });
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Export/Import functionality
  exportData(): string {
    return JSON.stringify({
      preferences: this._preferences(),
      history: this._history(),
      stats: this._stats(),
      exportDate: new Date().toISOString()
    });
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.preferences) {
        this._preferences.set({ ...this.getDefaultPreferences(), ...data.preferences });
        this.savePreferences(this._preferences());
      }
      
      if (data.history) {
        const historyWithDates = data.history.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        this._history.set(historyWithDates);
        this.saveHistory(historyWithDates);
      }
      
      if (data.stats) {
        this._stats.set({
          ...this.getDefaultStats(),
          ...data.stats,
          lastUsed: new Date(data.stats.lastUsed)
        });
        this.saveStats(this._stats());
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    this.resetPreferences();
    this.clearHistory();
    this.resetStats();
  }

  // Check storage quota
  getStorageUsage(): { used: number; available: number } {
    if (!navigator.storage || !navigator.storage.estimate) {
      return { used: 0, available: 0 };
    }

    return navigator.storage.estimate().then(estimate => ({
      used: estimate.usage || 0,
      available: estimate.quota || 0
    })) as any;
  }

  // Theme management helpers
  getEffectiveTheme(): 'light' | 'dark' {
    const preference = this._preferences().theme;
    if (preference === 'auto') {
      if (this.isBrowser() && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light'; // Default to light theme on server
    }
    return preference;
  }
}