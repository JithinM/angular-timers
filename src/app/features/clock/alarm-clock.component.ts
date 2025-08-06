import { Component, OnInit, OnDestroy, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { StorageService } from '../../core/services/storage.service';
import { AudioService } from '../../core/services/audio.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

interface Alarm {
  id: string;
  time: string; // HH:MM format
  label: string;
  enabled: boolean;
  repeat: string[]; // Days of week: ['mon', 'tue', ...] or ['once']
  sound: string;
  snooze: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-alarm-clock',
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
    MatListModule,
    MatSnackBarModule,
    AdSlotComponent
  ],
  template: `
    <div class="alarm-clock-container">
      <!-- Top Ad Banner -->
      <app-ad-slot
        size="banner"
        position="top"
        [showPlaceholder]="true"
        class="no-print">
      </app-ad-slot>
      
      <!-- Header -->
      <header class="alarm-header">
        <h1>
          <mat-icon>alarm</mat-icon>
          Alarm Clock
        </h1>
        <p>Set multiple alarms with custom sounds and snooze</p>
      </header>

      <!-- Current Time Display -->
      <section class="current-time-section">
        <mat-card class="time-card">
          <div class="current-time">
            {{ currentTime() | date:'HH:mm:ss' }}
          </div>
          <div class="current-date">
            {{ currentTime() | date:'EEEE, MMMM d, y' }}
          </div>
        </mat-card>
      </section>

      <!-- Add New Alarm Form -->
      <section class="add-alarm-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>add_alarm</mat-icon>
              Add New Alarm
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form (ngSubmit)="addAlarm()" #alarmForm="ngForm">
              <div class="form-row">
                <mat-form-field appearance="fill">
                  <mat-label>Time</mat-label>
                  <input 
                    matInput 
                    type="time" 
                    [(ngModel)]="newAlarmTime" 
                    name="time"
                    required>
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Label</mat-label>
                  <input 
                    matInput 
                    [(ngModel)]="newAlarmLabel" 
                    name="label"
                    placeholder="Morning alarm">
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="fill">
                  <mat-label>Sound</mat-label>
                  <mat-select [(ngModel)]="newAlarmSound" name="sound">
                    <mat-option value="beep">Beep</mat-option>
                    <mat-option value="ringtone">Ringtone</mat-option>
                    <mat-option value="nature">Nature Sounds</mat-option>
                    <mat-option value="custom">Custom Sound</mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="toggle-group">
                  <mat-slide-toggle 
                    [(ngModel)]="newAlarmSnooze" 
                    name="snooze">
                    Enable Snooze
                  </mat-slide-toggle>
                </div>
              </div>

              <div class="repeat-section">
                <label>Repeat:</label>
                <div class="repeat-buttons">
                  <button 
                    type="button"
                    mat-stroked-button
                    [color]="selectedDays().includes('once') ? 'primary' : ''"
                    (click)="toggleDay('once')"
                    [class.active]="selectedDays().includes('once')">
                    Once
                  </button>
                  <button 
                    type="button"
                    mat-stroked-button
                    [color]="selectedDays().includes('daily') ? 'primary' : ''"
                    (click)="toggleDay('daily')"
                    [class.active]="selectedDays().includes('daily')">
                    Daily
                  </button>
                  <button 
                    type="button"
                    mat-stroked-button
                    *ngFor="let day of weekDays"
                    [color]="selectedDays().includes(day.value) ? 'primary' : ''"
                    (click)="toggleDay(day.value)"
                    [class.active]="selectedDays().includes(day.value)">
                    {{ day.label }}
                  </button>
                </div>
              </div>

              <div class="form-actions">
                <button 
                  mat-raised-button 
                  color="primary" 
                  type="submit"
                  [disabled]="!newAlarmTime">
                  Add Alarm
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Active Alarms List -->
      <section class="alarms-section" *ngIf="alarms().length > 0">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>alarm_on</mat-icon>
              Your Alarms
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              <mat-list-item *ngFor="let alarm of alarms(); trackBy: trackByAlarmId">
                <div class="alarm-item">
                  <div class="alarm-time">
                    <span class="time">{{ alarm.time }}</span>
                    <span class="label" *ngIf="alarm.label">{{ alarm.label }}</span>
                  </div>
                  
                  <div class="alarm-controls">
                    <mat-slide-toggle 
                      [(ngModel)]="alarm.enabled"
                      (change)="toggleAlarm(alarm)"
                      name="alarm-{{alarm.id}}">
                    </mat-slide-toggle>
                    
                    <button 
                      mat-icon-button 
                      (click)="editAlarm(alarm)"
                      [attr.aria-label]="'Edit alarm'">
                      <mat-icon>edit</mat-icon>
                    </button>
                    
                    <button 
                      mat-icon-button 
                      (click)="deleteAlarm(alarm.id)"
                      color="warn"
                      [attr.aria-label]="'Delete alarm'">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
                
                <div class="alarm-details">
                  <span class="repeat">{{ formatRepeat(alarm.repeat) }}</span>
                  <span class="sound">{{ alarm.sound }}</span>
                  <span class="snooze" *ngIf="alarm.snooze">Snooze: On</span>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Next Alarm Display -->
      <section class="next-alarm-section" *ngIf="nextAlarm()">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>schedule</mat-icon>
              Next Alarm
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="next-alarm-display">
              <div class="next-alarm-time">{{ nextAlarm()!.time }}</div>
              <div class="next-alarm-label">{{ nextAlarm()!.label || 'Alarm' }}</div>
              <div class="next-alarm-time-until">{{ timeUntilNextAlarm() }}</div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>
      
      <!-- Bottom Ad Banner -->
      <app-ad-slot
        size="banner"
        position="bottom"
        [showPlaceholder]="true"
        class="no-print">
      </app-ad-slot>
    </div>
  `,
  styles: [`
    .alarm-clock-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .alarm-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .alarm-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .alarm-header p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .current-time-section {
      margin-bottom: 2rem;
    }

    .time-card {
      text-align: center;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }

    .current-time {
      font-size: 3rem;
      font-weight: 300;
      font-family: 'Roboto Mono', monospace;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .current-date {
      font-size: 1.25rem;
      color: var(--text-secondary);
    }

    .add-alarm-section {
      margin-bottom: 2rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .toggle-group {
      display: flex;
      align-items: center;
      padding-top: 1rem;
    }

    .repeat-section {
      margin: 1.5rem 0;
    }

    .repeat-section label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .repeat-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .repeat-buttons button {
      min-width: auto;
      padding: 0 12px;
      height: 36px;
      font-size: 0.875rem;
    }

    .repeat-buttons button.active {
      background-color: var(--primary-color);
      color: white;
    }

    .form-actions {
      text-align: center;
      margin-top: 1rem;
    }

    .alarm-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .alarm-time {
      display: flex;
      flex-direction: column;
    }

    .alarm-time .time {
      font-size: 1.5rem;
      font-weight: 500;
      font-family: 'Roboto Mono', monospace;
    }

    .alarm-time .label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .alarm-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .alarm-details {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .next-alarm-display {
      text-align: center;
    }

    .next-alarm-time {
      font-size: 2rem;
      font-weight: 300;
      font-family: 'Roboto Mono', monospace;
      color: var(--primary-color);
    }

    .next-alarm-label {
      font-size: 1.125rem;
      margin: 0.5rem 0;
    }

    .next-alarm-time-until {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .alarm-header h1 {
        font-size: 2rem;
      }

      .current-time {
        font-size: 2rem;
      }

      .form-row {
        flex-direction: column;
      }

      .repeat-buttons {
        justify-content: center;
      }

      .alarm-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .alarm-controls {
        align-self: flex-end;
      }
    }

    @media (max-width: 480px) {
      .alarm-clock-container {
        padding: 0.75rem;
      }

      .time-card {
        padding: 1rem;
      }

      .current-time {
        font-size: 1.75rem;
      }
    }
  `]
})
export class AlarmClockComponent implements OnInit, OnDestroy {
  currentTime = signal(new Date());
  alarms = signal<Alarm[]>([]);
  selectedDays = signal<string[]>(['once']);
  
  // New alarm form values
  newAlarmTime = '';
  newAlarmLabel = '';
  newAlarmSound = 'beep';
  newAlarmSnooze = true;
  
  weekDays = [
    { value: 'mon', label: 'Mon' },
    { value: 'tue', label: 'Tue' },
    { value: 'wed', label: 'Wed' },
    { value: 'thu', label: 'Thu' },
    { value: 'fri', label: 'Fri' },
    { value: 'sat', label: 'Sat' },
    { value: 'sun', label: 'Sun' }
  ];

  private timeInterval: any;
  private audioService = inject(AudioService);
  private storageService = inject(StorageService);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    this.loadAlarms();
    if (this.isBrowser) {
      this.startTimeUpdates();
    }
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  private startTimeUpdates(): void {
    if (!this.isBrowser) return;
    
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
      this.checkAlarms();
    }, 1000);
  }

  private updateTime(): void {
    this.currentTime.set(new Date());
  }

  private checkAlarms(): void {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Check if any alarms should trigger
    this.alarms().forEach(alarm => {
      if (alarm.enabled && alarm.time === currentTime) {
        this.triggerAlarm(alarm);
      }
    });
  }

  private triggerAlarm(alarm: Alarm): void {
    if (!this.isBrowser) return;
    
    // Play alarm sound using a beep pattern
    this.audioService.playPattern('completion');
    
    // Show notification
    this.snackBar.open(`⏰ ${alarm.label || 'Alarm'}!`, 'Snooze', {
      duration: 60000, // 1 minute
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      // Snooze for 5 minutes
      setTimeout(() => {
        this.triggerAlarm(alarm);
      }, 5 * 60 * 1000);
    });
  }

  addAlarm(): void {
    if (!this.newAlarmTime) return;

    const alarm: Alarm = {
      id: Date.now().toString(),
      time: this.newAlarmTime,
      label: this.newAlarmLabel,
      enabled: true,
      repeat: this.selectedDays(),
      sound: this.newAlarmSound,
      snooze: this.newAlarmSnooze,
      createdAt: new Date()
    };

    this.alarms.update(alarms => [...alarms, alarm]);
    this.saveAlarms();
    
    // Reset form
    this.newAlarmTime = '';
    this.newAlarmLabel = '';
    this.selectedDays.set(['once']);
    
    if (this.isBrowser) {
      this.snackBar.open('Alarm added successfully!', 'Close', { duration: 3000 });
    }
  }

  toggleAlarm(alarm: Alarm): void {
    this.alarms.update(alarms => 
      alarms.map(a => a.id === alarm.id ? { ...a, enabled: !a.enabled } : a)
    );
    this.saveAlarms();
  }

  editAlarm(alarm: Alarm): void {
    // For simplicity, we'll just toggle the enabled state
    // In a real app, you'd open an edit dialog
    this.toggleAlarm(alarm);
  }

  deleteAlarm(id: string): void {
    this.alarms.update(alarms => alarms.filter(alarm => alarm.id !== id));
    this.saveAlarms();
    if (this.isBrowser) {
      this.snackBar.open('Alarm deleted', 'Close', { duration: 3000 });
    }
  }

  toggleDay(day: string): void {
    if (day === 'once' || day === 'daily') {
      this.selectedDays.set([day]);
    } else {
      const current = this.selectedDays();
      if (current.includes(day)) {
        this.selectedDays.set(current.filter(d => d !== day));
      } else {
        // Remove 'once' or 'daily' if adding a specific day
        const filtered = current.filter(d => d !== 'once' && d !== 'daily');
        this.selectedDays.set([...filtered, day]);
      }
    }
  }

  formatRepeat(repeat: string[]): string {
    if (repeat.includes('once')) return 'Once';
    if (repeat.includes('daily')) return 'Daily';
    if (repeat.length === 7) return 'Every day';
    if (repeat.length === 0) return 'Never';
    
    const dayNames: { [key: string]: string } = {
      'mon': 'Mon',
      'tue': 'Tue',
      'wed': 'Wed',
      'thu': 'Thu',
      'fri': 'Fri',
      'sat': 'Sat',
      'sun': 'Sun'
    };
    
    return repeat.map(day => dayNames[day] || day).join(', ');
  }

  nextAlarm = computed(() => {
    const alarms = this.alarms();
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Find the next enabled alarm
    const futureAlarms = alarms
      .filter(alarm => alarm.enabled)
      .map(alarm => {
        const [hours, minutes] = alarm.time.split(':').map(Number);
        const alarmTime = hours * 60 + minutes;
        return { ...alarm, timeInMinutes: alarmTime };
      })
      .filter(alarm => alarm.timeInMinutes > currentTime || alarm.repeat.includes('daily'));
    
    if (futureAlarms.length === 0) return null;
    
    // Sort by time and return the first one
    futureAlarms.sort((a, b) => a.timeInMinutes - b.timeInMinutes);
    return futureAlarms[0];
  });

  timeUntilNextAlarm = computed(() => {
    const next = this.nextAlarm();
    if (!next) return '';
    
    const now = new Date();
    const [hours, minutes] = next.time.split(':').map(Number);
    const nextAlarmDate = new Date();
    nextAlarmDate.setHours(hours, minutes, 0, 0);
    
    // If the alarm is for tomorrow
    if (nextAlarmDate <= now) {
      nextAlarmDate.setDate(nextAlarmDate.getDate() + 1);
    }
    
    const diff = nextAlarmDate.getTime() - now.getTime();
    const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursUntil > 0) {
      return `in ${hoursUntil}h ${minutesUntil}m`;
    } else {
      return `in ${minutesUntil} minutes`;
    }
  });

  private loadAlarms(): void {
    if (!this.isBrowser || typeof localStorage === 'undefined') return;
    
    try {
      const saved = localStorage.getItem('alarm-clock-alarms');
      if (saved) {
        const alarms = JSON.parse(saved);
        this.alarms.set(alarms);
      }
    } catch (error) {
      console.warn('Error loading alarms:', error);
    }
  }

  private saveAlarms(): void {
    if (!this.isBrowser || typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem('alarm-clock-alarms', JSON.stringify(this.alarms()));
    } catch (error) {
      console.warn('Error saving alarms:', error);
    }
  }

  trackByAlarmId(index: number, alarm: Alarm): string {
    return alarm.id;
  }
}