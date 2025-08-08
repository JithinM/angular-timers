import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService } from '../../core/services/notifications.service';
import { AudioService } from '../../core/services/audio.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';

@Component({
  selector: 'app-test-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-background-container">
      <h2>Background Notification Test</h2>
      
      <div class="status-section">
        <h3>Current Status</h3>
        <div class="status-grid">
          <div class="status-item">
            <label>Notification Permission:</label>
            <span [class]="'status-' + notificationStatus">{{ notificationStatus }}</span>
          </div>
          <div class="status-item">
            <label>Audio Enabled:</label>
            <span [class]="'status-' + (audioEnabled ? 'granted' : 'denied')">{{ audioEnabled ? 'Yes' : 'No' }}</span>
          </div>
          <div class="status-item">
            <label>Tab Hidden:</label>
            <span [class]="'status-' + (isTabHidden ? 'active' : 'inactive')">{{ isTabHidden ? 'Yes' : 'No' }}</span>
          </div>
          <div class="status-item">
            <label>Background Sync:</label>
            <span [class]="'status-' + (backgroundSyncStatus.isActive ? 'active' : 'inactive')">
              {{ backgroundSyncStatus.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <h3>Test Actions</h3>
        <div class="button-grid">
          <button (click)="requestPermissions()" class="test-button">
            Request Permissions
          </button>
          
          <button (click)="testNotification()" class="test-button" [disabled]="notificationStatus !== 'granted'">
            Test Notification
          </button>
          
          <button (click)="testAudio()" class="test-button" [disabled]="!audioEnabled">
            Test Audio
          </button>
          
          <button (click)="testBackgroundTimer()" class="test-button">
            Test Background Timer (5s)
          </button>
          
          <button (click)="testCombined()" class="test-button">
            Test Combined (Audio + Notification)
          </button>
        </div>
      </div>

      <div class="instructions-section">
        <h3>Instructions</h3>
        <ol>
          <li>Click "Request Permissions" to enable notifications</li>
          <li>Test individual components (notification, audio)</li>
          <li>Click "Test Background Timer" and switch to another tab</li>
          <li>Wait 5 seconds to see if notification appears</li>
          <li>Check if audio plays when you return to the tab</li>
        </ol>
      </div>

      <div class="tips-section">
        <h3>Troubleshooting Tips</h3>
        <ul>
          <li>Make sure notifications are allowed in browser settings</li>
          <li>Audio may require user interaction to work in background</li>
          <li>Some browsers limit background tab functionality</li>
          <li>Service worker must be registered for full functionality</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .test-background-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }

    .status-section, .test-section, .instructions-section, .tips-section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: white;
      border-radius: 4px;
      border: 1px solid #eee;
    }

    .status-item label {
      font-weight: bold;
      color: #333;
    }

    .status-granted, .status-active {
      color: #28a745;
      font-weight: bold;
    }

    .status-denied, .status-inactive {
      color: #dc3545;
      font-weight: bold;
    }

    .status-default {
      color: #ffc107;
      font-weight: bold;
    }

    .button-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }

    .test-button {
      padding: 12px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.2s;
    }

    .test-button:hover:not(:disabled) {
      background: #0056b3;
    }

    .test-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    h2 {
      color: #333;
      text-align: center;
      margin-bottom: 30px;
    }

    h3 {
      color: #555;
      margin-bottom: 15px;
      border-bottom: 2px solid #007bff;
      padding-bottom: 5px;
    }

    ol, ul {
      padding-left: 20px;
    }

    li {
      margin-bottom: 8px;
      line-height: 1.5;
    }
  `]
})
export class TestBackgroundComponent {
  private notificationsService = inject(NotificationsService);
  private audioService = inject(AudioService);
  private backgroundTimerService = inject(BackgroundTimerService);

  notificationStatus: NotificationPermission = 'default';
  audioEnabled = false;
  isTabHidden = false;
  backgroundSyncStatus = { isActive: false, hasWakeLock: false, notificationPermission: 'default' as NotificationPermission };

  constructor() {
    this.updateStatus();
    this.setupVisibilityListener();
  }

  private updateStatus(): void {
    this.notificationStatus = this.notificationsService.getPermissionStatus();
    this.audioEnabled = this.audioService.settings().enabled;
    this.backgroundSyncStatus = this.backgroundTimerService.getBackgroundSyncStatus();
    this.isTabHidden = this.backgroundTimerService.isTabHidden();
  }

  private setupVisibilityListener(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        this.isTabHidden = document.hidden;
      });
    }
  }

  async requestPermissions(): Promise<void> {
    try {
      const permissions = await this.backgroundTimerService.requestBackgroundPermissions();
      console.log('Permissions granted:', permissions);
      this.updateStatus();
    } catch (error) {
      console.error('Failed to request permissions:', error);
    }
  }

  testNotification(): void {
    this.notificationsService.sendCustomNotification(
      'Test Notification',
      'This is a test notification to verify background functionality works correctly.',
      {
        requireInteraction: true,
        tag: 'test-notification'
      }
    );
  }

  async testAudio(): Promise<void> {
    try {
      await this.audioService.playSoundWithResume('bell');
      console.log('Audio test completed');
    } catch (error) {
      console.error('Audio test failed:', error);
    }
  }

  testBackgroundTimer(): void {
    // Simulate a timer completion after 5 seconds
    setTimeout(() => {
      this.notificationsService.sendTimerCompletion('Test Timer', 'Background timer test completed!');
      this.audioService.playTimerCompleteWithNotification();
    }, 5000);

    alert('Background timer started! Switch to another tab and wait 5 seconds to test background notifications.');
  }

  async testCombined(): Promise<void> {
    try {
      // Test both notification and audio together
      this.notificationsService.sendCustomNotification(
        'Combined Test',
        'Testing both notification and audio together',
        { requireInteraction: true }
      );
      
      await this.audioService.playTimerCompleteWithNotification();
      console.log('Combined test completed');
    } catch (error) {
      console.error('Combined test failed:', error);
    }
  }
}