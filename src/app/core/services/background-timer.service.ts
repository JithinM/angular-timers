import { Injectable, inject, DestroyRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationsService } from './notifications.service';
import { StorageService } from './storage.service';
import { AudioService } from './audio.service';
import { TimerStoreService, TimerState as StoreTimerState, EggTimerState, BombTimerState } from './timer-store.service';

@Injectable({
  providedIn: 'root'
})
export class BackgroundTimerService {
  private wakeLock: WakeLockSentinel | null = null;
  private isBackgroundSyncActive = false;
  private backgroundSyncInterval: number | null = null;
  private router = inject(Router);
  private timerStore = inject(TimerStoreService);
  private destroyRef = inject(DestroyRef);
  private currentRoute: string = '';

  constructor(
    private notificationsService: NotificationsService,
    private storageService: StorageService,
    private audioService: AudioService
  ) {
    // Initialize background timer features
    if (typeof window !== 'undefined') {
      this.setupVisibilityHandler();
      this.setupBeforeUnloadHandler();
    }

    // Listen to store changes for background sync management
    this.timerStore.hasRunningTimers$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(hasRunningTimers => {
      if (hasRunningTimers && this.isTabHidden()) {
        this.startBackgroundSync();
      } else if (!hasRunningTimers) {
        this.stopBackgroundSync();
      }
    });
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
   * Send message to service worker
   */
  private sendMessageToServiceWorker(message: any): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  /**
   * Setup before unload handler to save timer state
   */
  private setupBeforeUnloadHandler(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      // Export timer state for persistence on page unload
      const storeState = this.timerStore.exportState();
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('timer-store-backup', JSON.stringify(storeState));
        } catch (error) {
          console.warn('Failed to backup timer store on page unload:', error);
        }
      }
    });
  }

  /**
   * Handle when tab becomes hidden/inactive
   */
  private handleTabHidden(): void {
    // Export current timer store state for persistence
    const storeState = this.timerStore.exportState();

    // Start background sync if any timer is running
    const runningTimers = Object.values(storeState.activeTimers).filter(timer => timer.isRunning);
    if (runningTimers.length > 0) {
      this.startBackgroundSync();
      
      // Send timer states to service worker for monitoring
      this.sendMessageToServiceWorker({
        type: 'TIMER_STATES',
        states: storeState
      });
    }
  }

  /**
   * Handle when tab becomes visible/active
   */
  private handleTabVisible(): void {
    // Stop background sync when tab becomes visible
    this.stopBackgroundSync();

    // Timer restoration is now handled automatically by the TimerService
    // through its own visibility change handler
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

      // Check all timer types for completion while tab was hidden
      if (states.countdown.isRunning) {
        const newTimeRemaining = Math.max(0, states.countdown.timeRemaining - timeElapsed);
        if (newTimeRemaining === 0 && states.countdown.timeRemaining > 0) {
          this.notificationsService.sendTimerCompletion('Countdown', 'Your countdown timer has finished!');
        }
      }

      if (states.eggTimer?.isRunning) {
        const newTimeRemaining = Math.max(0, states.eggTimer.timeRemaining - timeElapsed);
        if (newTimeRemaining === 0 && states.eggTimer.timeRemaining > 0) {
          this.notificationsService.sendTimerCompletion('Egg Timer', 'Your eggs are ready!');
        }
      }

      if (states.bombTimer?.isRunning) {
        const newTimeRemaining = Math.max(0, states.bombTimer.timeRemaining - timeElapsed);
        if (newTimeRemaining === 0 && states.bombTimer.timeRemaining > 0) {
          this.notificationsService.sendTimerCompletion('Bomb Timer', 'BOOM! The bomb exploded!');
        }
      }

      if (states.basketballTimer?.isRunning) {
        const newTimeRemaining = Math.max(0, states.basketballTimer.timeRemaining - timeElapsed);
        if (newTimeRemaining === 0 && states.basketballTimer.timeRemaining > 0) {
          this.notificationsService.sendTimerCompletion('Basketball Timer', 'Period ended!');
        }
      }

      if (states.hockeyTimer?.isRunning) {
        const newTimeRemaining = Math.max(0, states.hockeyTimer.timeRemaining - timeElapsed);
        if (newTimeRemaining === 0 && states.hockeyTimer.timeRemaining > 0) {
          this.notificationsService.sendTimerCompletion('Hockey Timer', 'Period ended!');
        }
      }

      if (states.presentationTimer?.isRunning) {
        const newTimeRemaining = Math.max(0, states.presentationTimer.timeRemaining - timeElapsed);
        if (newTimeRemaining === 0 && states.presentationTimer.timeRemaining > 0) {
          this.notificationsService.sendTimerCompletion('Presentation Timer', 'Segment completed!');
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
    const storeState = this.timerStore.getCurrentState();
    if (!storeState.activeTimers || Object.keys(storeState.activeTimers).length === 0) return;

    const currentTime = Date.now();
    const timeElapsed = currentTime - storeState.lastUpdate;
    let statesUpdated = false;

    // Update running timers with elapsed time
    const runningTimers = Object.values(storeState.activeTimers).filter(timer => timer.isRunning);

    // Update each running timer
    for (const timer of runningTimers) {
      const newTimeRemaining = Math.max(0, timer.timeRemaining - timeElapsed);
      let updatedTimer: StoreTimerState = { ...timer };

      switch (timer.type) {
        case 'stopwatch':
          updatedTimer = {
            ...timer,
            timeElapsed: timer.timeElapsed + timeElapsed
          };
          break;

        case 'countdown':
          updatedTimer = {
            ...timer,
            timeRemaining: newTimeRemaining,
            isExpired: newTimeRemaining === 0,
            isRunning: newTimeRemaining > 0
          };
          
          // Check if countdown just expired
          if (newTimeRemaining === 0 && timer.timeRemaining > 0) {
            this.handleTimerCompletion('Countdown');
          }
          break;

        case 'eggTimer':
          updatedTimer = {
            ...timer,
            timeRemaining: newTimeRemaining,
            isRunning: newTimeRemaining > 0
          } as EggTimerState;

          // Handle completion for egg timer
          if (newTimeRemaining === 0 && timer.timeRemaining > 0) {
            this.handleTimerCompletion('Egg Timer');
            updatedTimer = { ...updatedTimer, isCompleted: true } as EggTimerState;
          }
          break;

        case 'bombTimer':
          updatedTimer = {
            ...timer,
            timeRemaining: newTimeRemaining,
            isRunning: newTimeRemaining > 0
          } as BombTimerState;

          // Handle completion for bomb timer
          if (newTimeRemaining === 0 && timer.timeRemaining > 0) {
            this.handleTimerCompletion('Bomb Timer');
            updatedTimer = { ...updatedTimer, isExploded: true } as BombTimerState;
          }
          break;

        case 'basketballTimer':
        case 'hockeyTimer':
        case 'presentationTimer':
          updatedTimer = {
            ...timer,
            timeRemaining: newTimeRemaining,
            isRunning: newTimeRemaining > 0
          };

          // Handle completion for these timers
          if (newTimeRemaining === 0 && timer.timeRemaining > 0) {
            const timerNames = {
              basketballTimer: 'Basketball Timer',
              hockeyTimer: 'Hockey Timer',
              presentationTimer: 'Presentation Timer'
            };
            this.handleTimerCompletion(timerNames[timer.type]);
          }
          break;

        // For complex timers like interval and pomodoro, we let the TimerService handle them
        // to avoid duplicating complex logic
        case 'interval':
        case 'pomodoro':
        case 'meditationTimer':
          // These timers have complex state transitions that should be handled by TimerService
          continue;
      }

      // Update the timer in the store if it changed
      if (JSON.stringify(updatedTimer) !== JSON.stringify(timer)) {
        this.timerStore.setTimer(updatedTimer);
        statesUpdated = true;
      }
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


  /**
   * Enhanced timer completion handler with audio and notification support
   */
  private async handleTimerCompletion(timerType: string): Promise<void> {
    try {
      // Send notification
      this.notificationsService.sendTimerCompletion(timerType);
      
      // Play completion sound with background support
      await this.audioService.playTimerCompleteWithNotification();
      
      // Try to focus the window if possible
      if (typeof window !== 'undefined' && window.focus) {
        window.focus();
      }
      
      // Vibrate if supported (mobile devices)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      // Clean up completed timer from localStorage after notification
      this.cleanupCompletedTimer(timerType);
    } catch (error) {
      console.warn('Error handling timer completion:', error);
    }
  }

  /**
   * Clean up completed timer from localStorage
   */
  private cleanupCompletedTimer(timerType: string): void {
    try {
      console.log(`Cleaning up completed ${timerType} from timer store...`);
      
      // Find and remove completed timers of this type from the store
      const storeState = this.timerStore.getCurrentState();
      const timerNames: Record<string, string> = {
        'Countdown': 'countdown',
        'Egg Timer': 'eggTimer',
        'Bomb Timer': 'bombTimer',
        'Basketball Timer': 'basketballTimer',
        'Hockey Timer': 'hockeyTimer',
        'Presentation Timer': 'presentationTimer',
        'Interval': 'interval',
        'Pomodoro': 'pomodoro'
      };

      const targetTimerType = timerNames[timerType];
      if (!targetTimerType) return;

      const completedTimers = Object.entries(storeState.activeTimers).filter(([_, timer]) => {
        return timer.type === targetTimerType && !timer.isRunning;
      });

      // Remove completed timers
      for (const [timerId] of completedTimers) {
        this.timerStore.removeTimer(timerId);
      }
      
      console.log(`Cleaned up completed ${timerType} from timer store`);
    } catch (error) {
      console.warn(`Failed to cleanup completed ${timerType}:`, error);
    }
  }

  /**
   * Request all necessary permissions for background functionality
   */
  async requestBackgroundPermissions(): Promise<{
    notifications: boolean;
    wakeLock: boolean;
  }> {
    const results = {
      notifications: false,
      wakeLock: false
    };

    try {
      // Request notification permission
      const notificationPermission = await this.notificationsService.requestPermission();
      results.notifications = notificationPermission === 'granted';

      // Request wake lock
      results.wakeLock = await this.requestWakeLock();

      return results;
    } catch (error) {
      console.warn('Error requesting background permissions:', error);
      return results;
    }
  }

  /**
   * Check if the tab is currently hidden/inactive
   */
  isTabHidden(): boolean {
    return typeof document !== 'undefined' && document.hidden;
  }

  /**
   * Get background sync status
   */
  getBackgroundSyncStatus(): {
    isActive: boolean;
    hasWakeLock: boolean;
    notificationPermission: NotificationPermission;
  } {
    return {
      isActive: this.isBackgroundSyncActive,
      hasWakeLock: this.wakeLock !== null,
      notificationPermission: this.notificationsService.getPermissionStatus()
    };
  }
}