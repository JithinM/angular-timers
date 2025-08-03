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

    // Send notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      new Notification(title, {
        body: options?.body || 'Timer completed!',
        icon: options?.icon || '/assets/icons/icon-192x192.png',
        badge: options?.badge || '/assets/icons/icon-72x72.png',
        ...options
      });
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