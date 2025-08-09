import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NotificationsService } from './notifications.service';
import { StorageService } from './storage.service';
import { AudioService } from './audio.service';

@Injectable({
  providedIn: 'root'
})
export class BackgroundTimerService {
  private wakeLock: WakeLockSentinel | null = null;
  private isBackgroundSyncActive = false;
  private backgroundSyncInterval: number | null = null;
  private router = inject(Router);
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
      this.setupNavigationHandler();
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
   * Setup navigation handler to detect when user navigates between timer pages
   */
  private setupNavigationHandler(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.handleNavigation(event.url);
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
      this.saveTimerState();
    });
  }

  /**
   * Handle when tab becomes hidden/inactive
   */
  private handleTabHidden(): void {
    // Save current timer states
    this.saveTimerState();

    // Notify service worker that tab is hidden
   // this.sendMessageToServiceWorker({ type: 'TAB_HIDDEN' });

    // Start background sync if any timer is running
    const savedStates = this.getSavedTimerStates();
    if (savedStates) {
      if (savedStates.stopwatch.isRunning || savedStates.countdown.isRunning ||
          savedStates.interval.isRunning || savedStates.pomodoro.isRunning ||
          savedStates.eggTimer?.isRunning || savedStates.bombTimer?.isRunning ||
          savedStates.basketballTimer?.isRunning || savedStates.hockeyTimer?.isRunning ||
          savedStates.presentationTimer?.isRunning) {
        this.startBackgroundSync();
        
        // Send timer states to service worker for monitoring
        this.sendMessageToServiceWorker({
          type: 'TIMER_STATES',
          states: savedStates
        });
      }
    }
  }

  /**
   * Handle when tab becomes visible/active
   */
  private handleTabVisible(): void {
    // Notify service worker that tab is visible
    // this.sendMessageToServiceWorker({ type: 'TAB_VISIBLE' });

    // Stop background sync
    this.stopBackgroundSync();

    // Trigger timer service to restore states with proper time calculation
    // The TimerService.restoreTimerStates() method will handle the time elapsed calculation
    this.triggerTimerRestore();
  }

  /**
   * Handle navigation between different timer pages
   */
  private handleNavigation(newUrl: string): void {
    const previousRoute = this.currentRoute;
    this.currentRoute = newUrl;

    // If navigating away from a timer page, save states and start background sync
    if (this.isTimerRoute(previousRoute) && !this.isTimerRoute(newUrl)) {
      this.handleLeavingTimerPage();
    }
    
    // If navigating to a timer page from non-timer page, stop background sync
    if (!this.isTimerRoute(previousRoute) && this.isTimerRoute(newUrl)) {
      this.handleEnteringTimerPage();
    }
  }

  /**
   * Check if a route is a timer page
   */
  private isTimerRoute(url: string): boolean {
    const timerRoutes = [
      '/stopwatch', '/countdown', '/interval', '/pomodoro',
      '/egg-timer', '/bomb-timer', '/basketball-timer',
      '/hockey-timer', '/presentation-timer', '/meditation-timer'
    ];
    return timerRoutes.some(route => url.includes(route));
  }

  /**
   * Handle leaving a timer page (start background sync if timers are running)
   */
  private handleLeavingTimerPage(): void {
    // Save current timer states
    this.saveTimerState();

    // Start background sync if any timer is running
    const savedStates = this.getSavedTimerStates();
    if (savedStates && this.hasRunningTimers(savedStates)) {
      this.startBackgroundSync();
    }
  }

  /**
   * Handle entering a timer page (stop background sync)
   */
  private handleEnteringTimerPage(): void {
    // Stop background sync since user is back on a timer page
    this.stopBackgroundSync();
    
    // Trigger timer service to restore states
    this.triggerTimerRestore();
  }

  /**
   * Check if any timers are currently running
   */
  private hasRunningTimers(savedStates: any): boolean {
    return savedStates.stopwatch.isRunning || savedStates.countdown.isRunning ||
           savedStates.interval.isRunning || savedStates.pomodoro.isRunning ||
           savedStates.eggTimer?.isRunning || savedStates.bombTimer?.isRunning ||
           savedStates.basketballTimer?.isRunning || savedStates.hockeyTimer?.isRunning ||
           savedStates.presentationTimer?.isRunning;
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
        this.handleTimerCompletion('Countdown');
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
            this.handleTimerCompletion('Interval');
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
            this.handleTimerCompletion('Pomodoro');
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

    // Update egg timer if running
    if (savedStates.eggTimer?.isRunning && !savedStates.eggTimer?.isCompleted) {
      const newTimeRemaining = Math.max(0, savedStates.eggTimer.timeRemaining - timeElapsed);
      updatedStates.eggTimer = {
        ...savedStates.eggTimer,
        timeRemaining: newTimeRemaining,
        isCompleted: newTimeRemaining === 0,
        isRunning: newTimeRemaining > 0
      };
      statesUpdated = true;

      // Check if egg timer just completed
      if (newTimeRemaining === 0 && savedStates.eggTimer.timeRemaining > 0) {
        this.handleTimerCompletion('Egg Timer');
      }
    }

    // Update bomb timer if running
    if (savedStates.bombTimer?.isRunning && !savedStates.bombTimer?.isExploded && !savedStates.bombTimer?.isDefused) {
      const newTimeRemaining = Math.max(0, savedStates.bombTimer.timeRemaining - timeElapsed);
      updatedStates.bombTimer = {
        ...savedStates.bombTimer,
        timeRemaining: newTimeRemaining,
        isExploded: newTimeRemaining === 0,
        isRunning: newTimeRemaining > 0
      };
      statesUpdated = true;

      // Check if bomb timer just exploded
      if (newTimeRemaining === 0 && savedStates.bombTimer.timeRemaining > 0) {
        this.handleTimerCompletion('Bomb Timer');
      }
    }

    // Update basketball timer if running
    if (savedStates.basketballTimer?.isRunning) {
      const newTimeRemaining = Math.max(0, savedStates.basketballTimer.timeRemaining - timeElapsed);
      updatedStates.basketballTimer = {
        ...savedStates.basketballTimer,
        timeRemaining: newTimeRemaining,
        isRunning: newTimeRemaining > 0
      };
      statesUpdated = true;

      // Check if basketball period just completed
      if (newTimeRemaining === 0 && savedStates.basketballTimer.timeRemaining > 0) {
        this.handleTimerCompletion('Basketball Timer');
      }
    }

    // Update hockey timer if running
    if (savedStates.hockeyTimer?.isRunning) {
      const newTimeRemaining = Math.max(0, savedStates.hockeyTimer.timeRemaining - timeElapsed);
      updatedStates.hockeyTimer = {
        ...savedStates.hockeyTimer,
        timeRemaining: newTimeRemaining,
        isRunning: newTimeRemaining > 0
      };
      statesUpdated = true;

      // Check if hockey period just completed
      if (newTimeRemaining === 0 && savedStates.hockeyTimer.timeRemaining > 0) {
        this.handleTimerCompletion('Hockey Timer');
      }
    }

    // Update presentation timer if running
    if (savedStates.presentationTimer?.isRunning && !savedStates.presentationTimer?.isPresentationComplete) {
      const newTimeRemaining = Math.max(0, savedStates.presentationTimer.timeRemaining - timeElapsed);
      updatedStates.presentationTimer = {
        ...savedStates.presentationTimer,
        timeRemaining: newTimeRemaining,
        isRunning: newTimeRemaining > 0
      };
      statesUpdated = true;

      // Check if presentation segment just completed
      if (newTimeRemaining === 0 && savedStates.presentationTimer.timeRemaining > 0) {
        this.handleTimerCompletion('Presentation Timer');
      }
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
      this.handleTimerCompletion('Countdown');
    }

    if (updatedStates.interval.isCompleted && !updatedStates.interval.isRunning) {
      this.handleTimerCompletion('Interval');
    }

    if (updatedStates.pomodoro.isCompleted && !updatedStates.pomodoro.isRunning) {
      this.handleTimerCompletion('Pomodoro');
    }

    if (updatedStates.eggTimer?.isCompleted && !updatedStates.eggTimer?.isRunning) {
      this.handleTimerCompletion('Egg Timer');
    }

    if (updatedStates.bombTimer?.isExploded && !updatedStates.bombTimer?.isRunning) {
      this.handleTimerCompletion('Bomb Timer');
    }

    if (updatedStates.basketballTimer && updatedStates.basketballTimer.timeRemaining === 0 && !updatedStates.basketballTimer.isRunning) {
      this.handleTimerCompletion('Basketball Timer');
    }

    if (updatedStates.hockeyTimer && updatedStates.hockeyTimer.timeRemaining === 0 && !updatedStates.hockeyTimer.isRunning) {
      this.handleTimerCompletion('Hockey Timer');
    }

    if (updatedStates.presentationTimer && updatedStates.presentationTimer.timeRemaining === 0 && !updatedStates.presentationTimer.isRunning) {
      this.handleTimerCompletion('Presentation Timer');
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
      const savedStates = this.getSavedTimerStates();
      if (!savedStates) return;

      // Reset the completed timer to its initial state
      switch (timerType.toLowerCase()) {
        case 'countdown':
          savedStates.countdown = {
            timeRemaining: 0,
            initialTime: 0,
            isRunning: false,
            isExpired: false
          };
          break;
        case 'egg timer':
          if (savedStates.eggTimer) {
            savedStates.eggTimer = {
              initialTime: 0,
              timeRemaining: 0,
              isRunning: false,
              isCompleted: false,
              selectedPreset: null
            };
          }
          break;
        case 'bomb timer':
          if (savedStates.bombTimer) {
            savedStates.bombTimer = {
              initialTime: 0,
              timeRemaining: 0,
              isRunning: false,
              isExploded: false,
              isDefused: false,
              difficulty: 'medium'
            };
          }
          break;
        case 'basketball timer':
          if (savedStates.basketballTimer) {
            savedStates.basketballTimer = {
              periodDuration: 0,
              timeRemaining: 0,
              isRunning: false,
              currentPeriod: 1,
              totalPeriods: 4,
              homeScore: 0,
              awayScore: 0
            };
          }
          break;
        case 'hockey timer':
          if (savedStates.hockeyTimer) {
            savedStates.hockeyTimer = {
              periodDuration: 0,
              timeRemaining: 0,
              isRunning: false,
              currentPeriod: 1,
              totalPeriods: 3,
              homePenalties: 0,
              awayPenalties: 0
            };
          }
          break;
        case 'presentation timer':
          if (savedStates.presentationTimer) {
            savedStates.presentationTimer = {
              segments: [],
              currentSegmentIndex: 0,
              timeRemaining: 0,
              isRunning: false,
              isPresentationComplete: false
            };
          }
          break;
        case 'interval':
          savedStates.interval = {
            workTime: 0,
            restTime: 0,
            currentCycle: 1,
            totalCycles: 1,
            timeRemaining: 0,
            isRunning: false,
            isWorkPhase: true,
            isCompleted: false,
            totalWorkTime: 0,
            totalRestTime: 0
          };
          break;
        case 'pomodoro':
          savedStates.pomodoro = {
            workTime: 0,
            shortBreakTime: 0,
            longBreakTime: 0,
            sessionsUntilLongBreak: 4,
            currentSession: 1,
            currentSessionType: 'work',
            timeRemaining: 0,
            isRunning: false,
            isCompleted: false,
            completedSessions: 0,
            totalWorkTime: 0,
            totalBreakTime: 0,
            sessionHistory: []
          };
          break;
      }

      // Update timestamp and save back to localStorage
      savedStates.timestamp = Date.now();
      localStorage.setItem('timer-states', JSON.stringify(savedStates));
      
      console.log(`Cleaned up completed ${timerType} from localStorage`);
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