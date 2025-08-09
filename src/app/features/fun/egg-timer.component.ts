import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { TimerService } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { StorageService } from '../../core/services/storage.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';
import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-egg-timer',
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
    MatProgressBarModule,
    MatSnackBarModule,
    TimeDisplayComponent,
    AdSlotComponent
  ],
  template: `
    <div class="egg-timer-container">
      <!-- Header -->
      <header class="egg-header">
        <h1>
          <mat-icon>egg</mat-icon>
          Egg Timer
        </h1>
        <p>Perfect timing for soft, medium, and hard-boiled eggs</p>
      </header>

      <!-- Egg Visualizer -->
      <section class="egg-visualizer">
        <div class="egg-container" [class.cooking]="isRunning()">
          <div class="egg-shell">
            <div class="egg-white">
              <div class="egg-yolk" 
                   [style.height.%]="yolkHeight()"
                   [class.cooked]="isCompleted()">
              </div>
            </div>
          </div>
          <div class="egg-shadow"></div>
        </div>
      </section>

      <!-- Timer Display -->
      <section class="timer-section">
        <mat-card class="timer-card">
          <mat-card-content>
            <app-time-display
              [time]="formattedTime()"
              [status]="timerDisplayStatus()"
              size="large"
              [animate]="isRunning()">
            </app-time-display>
            
            <mat-progress-bar 
              mode="determinate" 
              [value]="progress()"
              class="timer-progress">
            </mat-progress-bar>
            
            <div class="timer-controls">
              <button 
                mat-raised-button 
                color="primary"
                (click)="startTimer()"
                [disabled]="isRunning() || timeRemaining() === 0"
                *ngIf="!isCompleted()">
                <mat-icon>play_arrow</mat-icon>
                Start Cooking
              </button>
              
              <button 
                mat-raised-button 
                color="accent"
                (click)="pauseTimer()"
                *ngIf="isRunning()">
                <mat-icon>pause</mat-icon>
                Pause
              </button>
              
              <button 
                mat-raised-button 
                color="warn"
                (click)="resetTimer()"
                *ngIf="isRunning() || isCompleted() || timeRemaining() < initialTime()">
                <mat-icon>replay</mat-icon>
                Reset
              </button>
              
              <button 
                mat-raised-button 
                color="primary"
                (click)="resetTimer()"
                *ngIf="isCompleted()">
                <mat-icon>replay</mat-icon>
                Cook Again
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Preset Selection -->
      <section class="presets-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>restaurant</mat-icon>
              Egg Doneness Presets
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="presets-grid">
              <button 
                mat-stroked-button
                *ngFor="let preset of presets"
                class="preset-button"
                [class.active]="selectedPreset() === preset.name"
                (click)="selectPreset(preset)"
                [disabled]="isRunning()">
                <div class="preset-icon">
                  <mat-icon [style.color]="preset.color">{{ preset.icon }}</mat-icon>
                </div>
                <div class="preset-info">
                  <span class="preset-name">{{ preset.name }}</span>
                  <span class="preset-time">{{ preset.time }} minutes</span>
                  <span class="preset-description">{{ preset.description }}</span>
                </div>
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Custom Timer -->
      <section class="custom-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>tune</mat-icon>
              Custom Cooking Time
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="custom-controls">
              <mat-form-field appearance="fill">
                <mat-label>Minutes</mat-label>
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="customMinutes" 
                  min="1" 
                  max="30"
                  [disabled]="isRunning()">
              </mat-form-field>
              
              <mat-form-field appearance="fill">
                <mat-label>Seconds</mat-label>
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="customSeconds" 
                  min="0" 
                  max="59"
                  [disabled]="isRunning()">
              </mat-form-field>
              
              <button 
                mat-raised-button 
                (click)="setCustomTime()"
                [disabled]="isRunning() || (customMinutes === 0 && customSeconds === 0)">
                Set Custom Time
              </button>
            </div>
          </mat-card-content>
        </mat-card>
              </section>
              
              <!-- Ad Slot -->
              <section class="ad-section">
                <app-ad-slot
                  size="rectangle"
                  position="inline"
                  [showPlaceholder]="true"
                  class="inline-ad">
                </app-ad-slot>
              </section>
              
              <!-- Tips Section -->
              <section class="tips-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>tips_and_updates</mat-icon>
              Egg Cooking Tips
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ul class="tips-list">
              <li>Start with cold water for easier peeling</li>
              <li>Add a pinch of salt to the water to prevent cracking</li>
              <li>Use a timer for consistent results</li>
              <li>Transfer to ice water after cooking to stop the process</li>
              <li>Older eggs (1-2 weeks) peel more easily than fresh ones</li>
            </ul>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    .egg-timer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .egg-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .egg-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .egg-header p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .egg-visualizer {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .egg-container {
      position: relative;
      transition: transform 0.3s ease;
    }

    .egg-container.cooking {
      animation: gentle-bounce 2s infinite;
    }

    @keyframes gentle-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .egg-shell {
      width: 120px;
      height: 160px;
      background: #fffaf0;
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      position: relative;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      border: 2px solid #f0e6d2;
    }

    .egg-white {
      width: 100%;
      height: 100%;
      background: #fff;
      position: relative;
      overflow: hidden;
    }

    .egg-yolk {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #ffd700;
      border-radius: 50%;
      transition: height 0.5s ease;
    }

    .egg-yolk.cooked {
      background: #ff8c00;
    }

    .egg-shadow {
      width: 80px;
      height: 20px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 50%;
      margin: 10px auto 0;
      filter: blur(5px);
    }

    .timer-section {
      margin-bottom: 2rem;
    }

    .timer-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 1rem;
      text-align: center;
    }

    .timer-progress {
      margin: 1rem 0;
      height: 8px;
      border-radius: 4px;
    }

    .timer-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .timer-controls button {
      min-width: 120px;
    }

    .presets-section {
      margin-bottom: 2rem;
    }

    .presets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .preset-button {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      text-align: left;
      height: auto;
      min-height: 80px;
    }

    .preset-button.active {
      border-color: var(--primary-color);
      background: rgba(25, 118, 210, 0.05);
    }

    .preset-icon mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .preset-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .preset-name {
      font-weight: 500;
      font-size: 1.125rem;
    }

    .preset-time {
      color: var(--primary-color);
      font-weight: 500;
    }

    .preset-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .custom-section {
      margin-bottom: 2rem;
    }

    .custom-controls {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
    }

    .custom-controls mat-form-field {
      flex: 1;
      min-width: 100px;
    }

    .tips-section ul {
      padding-left: 1.5rem;
    }

    .tips-section li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .egg-header h1 {
        font-size: 2rem;
      }

      .presets-grid {
        grid-template-columns: 1fr;
      }

      .preset-button {
        flex-direction: column;
        text-align: center;
      }

      .timer-controls {
        flex-direction: column;
        align-items: center;
      }

      .timer-controls button {
        width: 100%;
        max-width: 200px;
      }

      .custom-controls {
        flex-direction: column;
      }

      .custom-controls mat-form-field {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .egg-timer-container {
        padding: 0.75rem;
      }

      .egg-shell {
        width: 100px;
        height: 140px;
      }
    }
  `]
})
export class EggTimerComponent implements OnInit {
  customMinutes = 5;
  customSeconds = 0;

  presets = [
    {
      name: 'Soft-Boiled',
      time: 4,
      description: 'Runny yolk, set white',
      icon: 'egg',
      color: '#ffd700'
    },
    {
      name: 'Medium-Boiled',
      time: 6,
      description: 'Creamy yolk, firm white',
      icon: 'egg',
      color: '#ffcc00'
    },
    {
      name: 'Hard-Boiled',
      time: 10,
      description: 'Firm yolk, fully cooked',
      icon: 'egg',
      color: '#ff8c00'
    }
  ];

  timerService = inject(TimerService);
  audioService = inject(AudioService);
  storageService = inject(StorageService);
  backgroundTimerService = inject(BackgroundTimerService);
  analyticsService = inject(AnalyticsService);
  snackBar = inject(MatSnackBar);
  seoService = inject(SeoService);

  // Use centralized state from TimerService
  eggTimerState = this.timerService.eggTimerState;
  
  initialTime = computed(() => this.eggTimerState().initialTime);
  timeRemaining = computed(() => this.eggTimerState().timeRemaining);
  isRunning = computed(() => this.eggTimerState().isRunning);
  isCompleted = computed(() => this.eggTimerState().isCompleted);
  selectedPreset = computed(() => this.eggTimerState().selectedPreset);

  progress = computed(() => {
    const initial = this.initialTime();
    const remaining = this.timeRemaining();
    if (initial === 0) return 0;
    return ((initial - remaining) / initial) * 100;
  });
  
  yolkHeight = computed(() => {
    const progress = this.progress();
    // Yolk starts at 100% (bottom) and moves up as cooking progresses
    return 100 - progress;
  });
  
  formattedTime = computed(() => {
    const milliseconds = this.timeRemaining();
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
  
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  });
  
  timerDisplayStatus = computed(() => {
    if (this.isCompleted()) return 'expired';
    if (this.isRunning()) return 'running';
    if (this.timeRemaining() < this.initialTime()) return 'paused';
    return 'stopped';
  });

  ngOnInit(): void {
    // Set default to medium-boiled
    this.selectPreset(this.presets[1]);
    
    // Set initial SEO metadata
    this.seoService.updateTimerToolSeo('Egg Timer', '6 Minute');
  }

  selectPreset(preset: any): void {
    const timeMs = preset.time * 60 * 1000;
    this.timerService.setEggTimerTime(timeMs, preset.name);
    this.timerService.saveTimerStates();
    
    // Update SEO metadata
    this.seoService.updateTimerToolSeo('Egg Timer', `${preset.time} Minute`);
  }

  setCustomTime(): void {
    const timeMs = (this.customMinutes * 60 + this.customSeconds) * 1000;
    if (timeMs > 0) {
      this.timerService.setEggTimerTime(timeMs);
      this.timerService.saveTimerStates();
      
      // Update SEO metadata
      const minutes = this.customMinutes;
      const seconds = this.customSeconds;
      let duration = '';
      
      if (minutes > 0 && seconds > 0) {
        duration = `${minutes} Minute ${seconds} Second`;
      } else if (minutes > 0) {
        duration = `${minutes} Minute`;
      } else {
        duration = `${seconds} Second`;
      }
      
      this.seoService.updateTimerToolSeo('Egg Timer', duration);
    }
  }

  startTimer(): void {
    if (this.timeRemaining() > 0) {
      this.timerService.startEggTimer();
      this.audioService.playSuccess();
      this.timerService.saveTimerStates();
      
      // Track timer start
      const durationSeconds = Math.floor(this.initialTime() / 1000);
      this.analyticsService.trackTimerStart('egg-timer', durationSeconds);
    }
  }

  pauseTimer(): void {
    this.timerService.stopEggTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer pause
    const elapsedSeconds = Math.floor((this.initialTime() - this.timeRemaining()) / 1000);
    this.analyticsService.trackTimerPause('egg-timer', elapsedSeconds);
  }

  resetTimer(): void {
    this.timerService.resetEggTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer reset
    this.analyticsService.trackTimerReset('egg-timer');
  }

  private wasCompleted = false;
  private lastCompletionTimestamp = 0;

  constructor() {
    // Effect to handle timer completion
    effect(() => {
      const completed = this.isCompleted();
      const timeRemaining = this.timeRemaining();
      const isRunning = this.isRunning();
      
      // Only trigger completion if:
      // 1. Timer is completed
      // 2. We haven't already handled this completion
      // 3. Time remaining is 0 (ensures it actually completed, not just restored as completed)
      // 4. Timer was recently running (prevents stale completion notifications)
      if (completed && !this.wasCompleted && timeRemaining === 0) {
        const now = Date.now();
        // Prevent duplicate notifications within 5 seconds and ensure timer was active recently
        if (now - this.lastCompletionTimestamp > 5000) {
          this.wasCompleted = true;
          this.lastCompletionTimestamp = now;
          this.onTimerComplete();
        }
      } else if (!completed) {
        this.wasCompleted = false;
      }
    }, { allowSignalWrites: true });
  }

  private onTimerComplete(): void {
    this.audioService.playPattern('completion');
    
    // Track timer completion
    const durationSeconds = Math.floor(this.initialTime() / 1000);
    this.analyticsService.trackTimerComplete('egg-timer', durationSeconds);
    
    // Show completion notification
    this.snackBar.open('🥚 Your eggs are ready!', 'Enjoy', {
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      // User clicked "Enjoy"
    });
  }
}