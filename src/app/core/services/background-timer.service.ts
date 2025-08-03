import { Injectable } from '@angular/core';
import { NotificationsService } from './notifications.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class BackgroundTimerService {
  private wakeLock: WakeLockSentinel | null = null;
  private isBackgroundSyncActive = false;
  private backgroundSyncInterval: number | null = null;

  constructor(
    private notificationsService: NotificationsService,
    private storageService: StorageService
  ) {
    // Initialize background timer features
    if (typeof window !== 'undefined') {
      this.setupVisibilityHandler();
      this.setupBeforeUnloadHandler();
    }
  }

  /**
   * Setup visibility change handler to detect when tab becomes inactive
   */
  private setupVisibilityHandler(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleTabHidden();
      } else {
        this.handleTabVisible();
      }
    });
  }

  /**
   * Setup before unload handler to save timer state
   */
  private setupBeforeUnloadHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      this.saveTimerState();
    });
  }

  /**
   * Handle when tab becomes hidden/inactive
   */
  private handleTabHidden(): void {
    // Save current timer states
    this.saveTimerState();

    // Start background sync if any timer is running
    const savedStates = this.getSavedTimerStates();
    if (savedStates) {
      if (savedStates.stopwatch.isRunning || savedStates.countdown.isRunning || 
          savedStates.interval.isRunning || savedStates.pomodoro.isRunning) {
        this.startBackgroundSync();
      }
    }
  }

  /**
   * Handle when tab becomes visible/active
   */
  private handleTabVisible(): void {
    // Stop background sync
    this.stopBackgroundSync();

    // Restore timer states and check for completed timers
    this.restoreAndCheckTimers();
  }

  /**
   * Save current timer states to localStorage
   */
  private saveTimerState(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      // Get current timer states from localStorage if they exist
      const savedStates = this.getSavedTimerStates();
      if (savedStates) {
        localStorage.setItem('timer-states', JSON.stringify(savedStates));
      }
    } catch (error) {
      console.warn('Failed to save timer states:', error);
    }
  }

  /**
   * Get saved timer states from localStorage
   */
  private getSavedTimerStates(): any {
    if (typeof localStorage === 'undefined') return null;

    try {
      const savedStates = localStorage.getItem('timer-states');
      return savedStates ? JSON.parse(savedStates) : null;
    } catch (error) {
      console.warn('Failed to get saved timer states:', error);
      return null;
    }
  }

  /**
   * Restore timer states from localStorage
   */
  private restoreTimerState(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const savedStates = localStorage.getItem('timer-states');
      if (!savedStates) return;

      const states = JSON.parse(savedStates);
      const timeElapsed = Date.now() - states.timestamp;

      // For countdown timers, we need to check if they've expired
      if (states.countdown.isRunning) {
        const newTimeRemaining = Math.max(0, states.countdown.timeRemaining - timeElapsed);
        if (newTimeRemaining === 0 && states.countdown.timeRemaining > 0) {
          // Timer expired while tab was hidden
          this.notificationsService.sendTimerCompletion('Countdown', 'Your countdown timer has finished!');
        }
      }
    } catch (error) {
      console.warn('Failed to restore timer states:', error);
    }
  }

  /**
   * Restore timer states and check for completed timers
   */
  private restoreAndCheckTimers(): void {
    this.restoreTimerState();

    // Check if any timers completed while tab was hidden
    const savedStates = this.getSavedTimerStates();
    if (savedStates) {
      // Check countdown timer completion
      if (savedStates.countdown.isExpired && !savedStates.countdown.isRunning) {
        this.notificationsService.sendTimerCompletion('Countdown');
      }

      // Check interval timer completion
      if (savedStates.interval.isCompleted && !savedStates.interval.isRunning) {
        this.notificationsService.sendTimerCompletion('Interval');
      }

      // Check pomodoro timer completion
      if (savedStates.pomodoro.isCompleted && !savedStates.pomodoro.isRunning) {
        this.notificationsService.sendTimerCompletion('Pomodoro');
      }
    }
  }

  /**
   * Start background synchronization
   */
  private startBackgroundSync(): void {
    if (this.isBackgroundSyncActive || typeof window === 'undefined') return;

    this.isBackgroundSyncActive = true;
    
    // Use setInterval for background sync (less precise but works in background)
    this.backgroundSyncInterval = window.setInterval(() => {
      this.syncTimers();
    }, 1000); // Check every second
  }

  /**
   * Stop background synchronization
   */
  private stopBackgroundSync(): void {
    if (!this.isBackgroundSyncActive) return;

    this.isBackgroundSyncActive = false;
    
    if (this.backgroundSyncInterval && typeof window !== 'undefined') {
      window.clearInterval(this.backgroundSyncInterval);
      this.backgroundSyncInterval = null;
    }
  }

  /**
   * Synchronize timer states in background
   */
  private syncTimers(): void {
    // Check for timer completions and send notifications
    const savedStates = this.getSavedTimerStates();
    if (!savedStates) return;

    // Check countdown completion
    if (savedStates.countdown.isExpired && !savedStates.countdown.isRunning) {
      this.notificationsService.sendTimerCompletion('Countdown');
    }

    // Check interval completion
    if (savedStates.interval.isCompleted && !savedStates.interval.isRunning) {
      this.notificationsService.sendTimerCompletion('Interval');
    }

    // Check pomodoro completion
    if (savedStates.pomodoro.isCompleted && !savedStates.pomodoro.isRunning) {
      this.notificationsService.sendTimerCompletion('Pomodoro');
    }
  }

  /**
   * Request screen wake lock to prevent device from sleeping
   */
  async requestWakeLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
      return false;
    }

    try {
      // @ts-ignore - wakeLock is not in TypeScript definitions yet
      this.wakeLock = await navigator.wakeLock.request('screen');
      return true;
    } catch (error) {
      console.warn('Failed to acquire wake lock:', error);
      return false;
    }
  }

  /**
   * Release screen wake lock
   */
  releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }

  /**
   * Check if wake lock is supported
   */
  isWakeLockSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  /**
   * Keep timer running in background with reduced precision
   */
  keepTimerRunning(timerType: 'stopwatch' | 'countdown' | 'interval' | 'pomodoro'): void {
    // This method would be called when a timer needs to continue running in background
    // For now, we rely on the service worker and background sync
  }
}