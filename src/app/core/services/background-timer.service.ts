import { Injectable, inject } from '@angular/core';
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

    // Trigger timer service to restore states with proper time calculation
    // The TimerService.restoreTimerStates() method will handle the time elapsed calculation
    this.triggerTimerRestore();
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
   * Trigger timer service to restore states
   * This will be called by TimerService when it's ready
   */
  triggerTimerRestore(): void {
    // This method will be called by TimerService to restore states
    // The actual restoration logic is handled by TimerService.restoreTimerStates()
    // which properly calculates elapsed time and updates all timer states
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
    const savedStates = this.getSavedTimerStates();
    if (!savedStates) return;

    const currentTime = Date.now();
    const timeElapsed = currentTime - savedStates.timestamp;
    let statesUpdated = false;

    // Update running timers with elapsed time
    const updatedStates = { ...savedStates };

    // Update stopwatch if running
    if (savedStates.stopwatch.isRunning) {
      updatedStates.stopwatch = {
        ...savedStates.stopwatch,
        timeElapsed: savedStates.stopwatch.timeElapsed + timeElapsed
      };
      statesUpdated = true;
    }

    // Update countdown if running
    if (savedStates.countdown.isRunning) {
      const newTimeRemaining = Math.max(0, savedStates.countdown.timeRemaining - timeElapsed);
      updatedStates.countdown = {
        ...savedStates.countdown,
        timeRemaining: newTimeRemaining,
        isExpired: newTimeRemaining === 0,
        isRunning: newTimeRemaining > 0
      };
      statesUpdated = true;

      // Check if countdown just expired
      if (newTimeRemaining === 0 && savedStates.countdown.timeRemaining > 0) {
        this.notificationsService.sendTimerCompletion('Countdown');
      }
    }

    // Update interval timer if running
    if (savedStates.interval.isRunning && !savedStates.interval.isCompleted) {
      const newTimeRemaining = Math.max(0, savedStates.interval.timeRemaining - timeElapsed);
      updatedStates.interval = {
        ...savedStates.interval,
        timeRemaining: newTimeRemaining
      };

      // Handle phase transitions for interval timer
      if (newTimeRemaining === 0) {
        if (savedStates.interval.isWorkPhase) {
          // Work phase completed, switch to rest
          updatedStates.interval = {
            ...updatedStates.interval,
            isWorkPhase: false,
            timeRemaining: savedStates.interval.restTime,
            totalWorkTime: savedStates.interval.totalWorkTime + savedStates.interval.workTime
          };
        } else {
          // Rest phase completed
          if (savedStates.interval.currentCycle >= savedStates.interval.totalCycles) {
            // All cycles completed
            updatedStates.interval = {
              ...updatedStates.interval,
              isCompleted: true,
              isRunning: false,
              timeRemaining: 0,
              totalRestTime: savedStates.interval.totalRestTime + savedStates.interval.restTime
            };
            this.notificationsService.sendTimerCompletion('Interval');
          } else {
            // Move to next cycle
            updatedStates.interval = {
              ...updatedStates.interval,
              currentCycle: savedStates.interval.currentCycle + 1,
              isWorkPhase: true,
              timeRemaining: savedStates.interval.workTime,
              totalRestTime: savedStates.interval.totalRestTime + savedStates.interval.restTime
            };
          }
        }
      }
      statesUpdated = true;
    }

    // Update pomodoro timer if running
    if (savedStates.pomodoro.isRunning && !savedStates.pomodoro.isCompleted) {
      const newTimeRemaining = Math.max(0, savedStates.pomodoro.timeRemaining - timeElapsed);
      updatedStates.pomodoro = {
        ...savedStates.pomodoro,
        timeRemaining: newTimeRemaining
      };

      // Handle session transitions for pomodoro timer
      if (newTimeRemaining === 0) {
        if (savedStates.pomodoro.currentSessionType === 'work') {
          // Work session completed, move to break
          const nextBreakType = savedStates.pomodoro.currentSession % savedStates.pomodoro.sessionsUntilLongBreak === 0 ? 'longBreak' : 'shortBreak';
          const nextBreakTime = nextBreakType === 'longBreak' ? savedStates.pomodoro.longBreakTime : savedStates.pomodoro.shortBreakTime;
          
          updatedStates.pomodoro = {
            ...updatedStates.pomodoro,
            currentSessionType: nextBreakType,
            timeRemaining: nextBreakTime,
            completedSessions: savedStates.pomodoro.completedSessions + 1,
            totalWorkTime: savedStates.pomodoro.totalWorkTime + savedStates.pomodoro.workTime,
            sessionHistory: [...savedStates.pomodoro.sessionHistory, {
              type: 'work',
              duration: savedStates.pomodoro.workTime,
              completedAt: new Date()
            }]
          };
        } else {
          // Break session completed
          if (savedStates.pomodoro.currentSession >= 8) { // Complete after 4 full cycles
            updatedStates.pomodoro = {
              ...updatedStates.pomodoro,
              isCompleted: true,
              isRunning: false,
              timeRemaining: 0,
              totalBreakTime: savedStates.pomodoro.totalBreakTime + (
                savedStates.pomodoro.currentSessionType === 'longBreak' ? savedStates.pomodoro.longBreakTime : savedStates.pomodoro.shortBreakTime
              ),
              sessionHistory: [...savedStates.pomodoro.sessionHistory, {
                type: savedStates.pomodoro.currentSessionType,
                duration: savedStates.pomodoro.currentSessionType === 'longBreak' ? savedStates.pomodoro.longBreakTime : savedStates.pomodoro.shortBreakTime,
                completedAt: new Date()
              }]
            };
            this.notificationsService.sendTimerCompletion('Pomodoro');
          } else {
            // Move to next work session
            updatedStates.pomodoro = {
              ...updatedStates.pomodoro,
              currentSession: savedStates.pomodoro.currentSession + 1,
              currentSessionType: 'work',
              timeRemaining: savedStates.pomodoro.workTime,
              totalBreakTime: savedStates.pomodoro.totalBreakTime + (
                savedStates.pomodoro.currentSessionType === 'longBreak' ? savedStates.pomodoro.longBreakTime : savedStates.pomodoro.shortBreakTime
              ),
              sessionHistory: [...savedStates.pomodoro.sessionHistory, {
                type: savedStates.pomodoro.currentSessionType,
                duration: savedStates.pomodoro.currentSessionType === 'longBreak' ? savedStates.pomodoro.longBreakTime : savedStates.pomodoro.shortBreakTime,
                completedAt: new Date()
              }]
            };
          }
        }
      }
      statesUpdated = true;
    }

    // Save updated states back to localStorage if any changes were made
    if (statesUpdated) {
      updatedStates.timestamp = currentTime;
      try {
        localStorage.setItem('timer-states', JSON.stringify(updatedStates));
      } catch (error) {
        console.warn('Failed to update timer states during sync:', error);
      }
    }

    // Check for completed timers and send notifications
    if (updatedStates.countdown.isExpired && !updatedStates.countdown.isRunning) {
      this.notificationsService.sendTimerCompletion('Countdown');
    }

    if (updatedStates.interval.isCompleted && !updatedStates.interval.isRunning) {
      this.notificationsService.sendTimerCompletion('Interval');
    }

    if (updatedStates.pomodoro.isCompleted && !updatedStates.pomodoro.isRunning) {
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