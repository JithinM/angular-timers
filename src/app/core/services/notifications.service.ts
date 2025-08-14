import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private notificationPermission: NotificationPermission = 'default';
  
  constructor(private storageService: StorageService) {
    // Request notification permission on service initialization
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.requestPermission();
    }
  }

  /**
   * Request permission to send notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      this.notificationPermission = await Notification.requestPermission();
      return this.notificationPermission;
    } catch (error) {
      console.warn('Notification permission request failed:', error);
      return 'denied';
    }
  }

  /**
   * Send a notification
   */
  sendNotification(title: string, options?: NotificationOptions): void {
    // Check if notifications are enabled
    const preferences = this.storageService.preferences();
    if (!preferences.audioEnabled) {
      return;
    }

    // Check permission
    if (this.notificationPermission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // Base notification options
    const baseOptions: any = {
      body: options?.body || 'Timer completed!',
      icon: options?.icon || '/assets/icons/icon-192x192.png',
      badge: options?.badge || '/assets/icons/icon-72x72.png',
      requireInteraction: true, // Keep notification visible until user interacts
      silent: false, // Allow system sound
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
      tag: options?.tag || 'timer-notification', // Replace previous notifications
      renotify: true, // Show notification even if tag exists
      timestamp: Date.now(),
      ...options
    };

    // Prefer Service Worker notifications when available (supports actions)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        navigator.serviceWorker.ready.then(reg => {
          // Include actions only for SW notifications
          const swOptions = {
            actions: [
              { action: 'dismiss', title: 'Dismiss' },
              { action: 'view', title: 'View Timer' }
            ],
            ...baseOptions
          } as NotificationOptions;
          reg.showNotification(title, swOptions);
        }).catch(() => {
          // Fallback to window Notification without actions
          this.showWindowNotification(title, baseOptions);
        });
        return;
      } catch {
        // Continue to fallback
      }
    }

    // Fallback to window Notification API (no actions supported)
    this.showWindowNotification(title, baseOptions);
  }

  private showWindowNotification(title: string, options: NotificationOptions): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    // Ensure no actions field is present to avoid constructor errors
    const { actions, ...opts } = options as any;
    const notification = new Notification(title, opts);

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    if (!(opts as any).requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }

  /**
   * Send a timer completion notification
   */
  sendTimerCompletion(timerType: string, message?: string): void {
    const title = `${timerType} Timer Completed`;
    const body = message || 'Your timer has finished!';
    
    this.sendNotification(title, {
      body,
      tag: 'timer-completion',
      requireInteraction: true
    });
  }

  /**
   * Send a Pomodoro session completion notification
   */
  sendPomodoroCompletion(sessionType: 'work' | 'shortBreak' | 'longBreak'): void {
    let title = 'Pomodoro Session Completed';
    let body = 'Time for a break!';
    
    switch (sessionType) {
      case 'work':
        body = 'Great work! Time for a break.';
        break;
      case 'shortBreak':
        title = 'Break Time Over';
        body = 'Ready for another focused session?';
        break;
      case 'longBreak':
        title = 'Long Break Completed';
        body = 'You\'ve earned it! Time to get back to work.';
        break;
    }
    
    this.sendNotification(title, {
      body,
      tag: 'pomodoro-completion',
      requireInteraction: true
    });
  }

  /**
   * Send an interval timer phase completion notification
   */
  sendIntervalCompletion(phaseType: 'work' | 'rest', cycle: number): void {
    const title = `${phaseType.charAt(0).toUpperCase() + phaseType.slice(1)} Phase Completed`;
    const body = `Cycle ${cycle} completed. Moving to next phase.`;
    
    this.sendNotification(title, {
      body,
      tag: 'interval-completion',
      requireInteraction: true
    });
  }

  /**
   * Send a custom notification
   */
  sendCustomNotification(title: string, body: string, options?: NotificationOptions): void {
    this.sendNotification(title, {
      body,
      ...options
    });
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return this.notificationPermission;
  }

  /**
   * Check if notifications are enabled in user preferences
   */
  areNotificationsEnabled(): boolean {
    const preferences = this.storageService.preferences();
    return preferences.audioEnabled;
  }
}