import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { StorageService, TimerPreferences } from '../../core/services/storage.service';
import { AudioService } from '../../core/services/audio.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="settings-container">
      <!-- Header -->
      <header class="settings-header">
        <h1>
          <mat-icon>settings</mat-icon>
          Settings
        </h1>
        <p>Customize your TimerTools experience</p>
      </header>

      <!-- Audio Settings -->
      <section class="settings-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>volume_up</mat-icon>
              Audio Settings
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="setting-item">
              <mat-slide-toggle 
                [(ngModel)]="preferences().audioEnabled"
                (change)="savePreferences()">
                Enable Audio Feedback
              </mat-slide-toggle>
              <p class="setting-description">Play sounds for timer events</p>
            </div>
            
            
            <div class="setting-item">
              <mat-form-field appearance="fill">
                <mat-label>Volume Level</mat-label>
                <mat-select
                  [(ngModel)]="volumeLevel"
                  (selectionChange)="onVolumeChange($event.value)">
                  <mat-option value="low">Low</mat-option>
                  <mat-option value="medium">Medium</mat-option>
                  <mat-option value="high">High</mat-option>
                </mat-select>
              </mat-form-field>
              <p class="setting-description">Adjust the volume of timer sounds</p>
            </div>
            
            <div class="setting-actions">
              <button mat-stroked-button (click)="testAudio()">
                <mat-icon>play_arrow</mat-icon>
                Test Audio
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Display Settings -->
      <section class="settings-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>visibility</mat-icon>
              Display Settings
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="setting-item">
              <mat-slide-toggle 
                [(ngModel)]="preferences().fullScreenMode"
                (change)="savePreferences()">
                Auto Fullscreen
              </mat-slide-toggle>
              <p class="setting-description">Automatically enter fullscreen for timers</p>
            </div>
            
            <div class="setting-item">
              <mat-form-field appearance="fill">
                <mat-label>Theme</mat-label>
                <mat-select
                  [(ngModel)]="preferences().theme"
                  (selectionChange)="savePreferences()">
                  <mat-option value="light">Light</mat-option>
                  <mat-option value="dark">Dark</mat-option>
                  <mat-option value="auto">Auto (System)</mat-option>
                </mat-select>
              </mat-form-field>
              <p class="setting-description">Choose your preferred theme</p>
            </div>
            
            <div class="setting-item">
              <mat-slide-toggle 
                [(ngModel)]="preferences().showMilliseconds"
                (change)="savePreferences()">
                Show Milliseconds
              </mat-slide-toggle>
              <p class="setting-description">Display millisecond precision in timers</p>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Timer Settings -->
      <section class="settings-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>timer</mat-icon>
              Timer Settings
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="setting-item">
              <mat-slide-toggle 
                [(ngModel)]="preferences().confirmReset"
                (change)="savePreferences()">
                Confirm Reset
              </mat-slide-toggle>
              <p class="setting-description">Show confirmation before resetting timers</p>
            </div>
            
            
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Data Management -->
      <section class="settings-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>storage</mat-icon>
              Data Management
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="data-info">
              <p><strong>Storage Used:</strong> {{ storageUsed() }}</p>
              <p><strong>History Items:</strong> {{ historyCount() }}</p>
            </div>
            
            <div class="setting-actions">
              <button mat-stroked-button (click)="exportData()">
                <mat-icon>download</mat-icon>
                Export Data
              </button>
              
              <button mat-stroked-button color="warn" (click)="clearData()">
                <mat-icon>delete</mat-icon>
                Clear All Data
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Reset Settings -->
      <section class="settings-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>restart_alt</mat-icon>
              Reset Settings
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Reset all settings to their default values</p>
            <div class="setting-actions">
              <button mat-raised-button color="warn" (click)="resetSettings()">
                <mat-icon>settings_backup_restore</mat-icon>
                Reset to Defaults
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    .settings-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .settings-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .settings-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .settings-header p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .settings-section {
      margin-bottom: 2rem;
    }

    mat-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    mat-card-header {
      margin-bottom: 1rem;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .setting-item {
      margin-bottom: 1.5rem;
    }

    .setting-item:last-child {
      margin-bottom: 0;
    }

    .setting-description {
      margin: 0.5rem 0 0 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .setting-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .setting-actions button {
      min-width: 120px;
    }

    .data-info {
      margin-bottom: 1rem;
    }

    .data-info p {
      margin: 0.5rem 0;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .settings-header h1 {
        font-size: 2rem;
      }

      .setting-actions {
        flex-direction: column;
      }

      .setting-actions button {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .settings-container {
        padding: 0.75rem;
      }

      .settings-header h1 {
        font-size: 1.75rem;
      }
    }
  `]
})
export class SettingsComponent implements OnInit {
  preferences = signal<TimerPreferences>({
    audioEnabled: true,
    volume: 0.7,
    theme: 'auto',
    defaultStopwatchFormat: 'mm:ss.cc',
    showMilliseconds: true,
    autoStartLaps: false,
    confirmReset: true,
    fullScreenMode: false,
    favoritePresets: []
  });
  
  volumeLevel = signal<'low' | 'medium' | 'high'>('medium');
  storageUsed = signal('0 KB');
  historyCount = signal(0);

  private storageService = inject(StorageService);
  private audioService = inject(AudioService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    // Load initial preferences
    this.preferences.set(this.storageService.preferences());
    
    // Set initial volume level based on preferences
    const volume = this.preferences().volume;
    if (volume < 0.33) {
      this.volumeLevel.set('low');
    } else if (volume < 0.66) {
      this.volumeLevel.set('medium');
    } else {
      this.volumeLevel.set('high');
    }
  }

  savePreferences(): void {
    this.storageService.updatePreferences(this.preferences());
    this.snackBar.open('Settings saved successfully!', 'Close', { duration: 3000 });
  }

  onVolumeChange(level: 'low' | 'medium' | 'high'): void {
    let volumeValue: number;
    switch (level) {
      case 'low':
        volumeValue = 0.3;
        break;
      case 'medium':
        volumeValue = 0.7;
        break;
      case 'high':
        volumeValue = 1.0;
        break;
      default:
        volumeValue = 0.7;
    }
    
    this.preferences.update(prefs => ({
      ...prefs,
      volume: volumeValue
    }));
    
    this.savePreferences();
  }

  testAudio(): void {
    this.audioService.playSuccess();
    this.snackBar.open('Audio test played!', 'Close', { duration: 2000 });
  }

  exportData(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.snackBar.open('Export not available in this environment', 'Close', { duration: 3000 });
      return;
    }
    
    const data = this.storageService.exportData();
    const dataBlob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timertools-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open('Data exported successfully!', 'Close', { duration: 3000 });
  }

  clearData(): void {
    const confirm = window.confirm('Are you sure you want to clear all data? This cannot be undone.');
    if (confirm) {
      this.storageService.clearAllData();
      this.snackBar.open('All data cleared successfully!', 'Close', { duration: 3000 });
    }
  }

  resetSettings(): void {
    const confirm = window.confirm('Are you sure you want to reset all settings to defaults?');
    if (confirm) {
      this.storageService.resetPreferences();
      this.preferences.set(this.storageService.preferences());
      
      // Update volume level signal
      const volume = this.preferences().volume;
      if (volume < 0.33) {
        this.volumeLevel.set('low');
      } else if (volume < 0.66) {
        this.volumeLevel.set('medium');
      } else {
        this.volumeLevel.set('high');
      }
      
      this.snackBar.open('Settings reset to defaults!', 'Close', { duration: 3000 });
    }
  }
}