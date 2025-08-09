import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { AudioService } from '../../core/services/audio.service';
import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { SeoService } from '../../core/services/seo.service';
import { TimerService } from '../../core/services/timer.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';

@Component({
  selector: 'app-bomb-timer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    TimeDisplayComponent,
    AdSlotComponent
  ],
  template: `
    <div class="bomb-timer-container">
      <!-- Header -->
      <header class="bomb-header">
        <h1>
          <mat-icon>whatshot</mat-icon>
          Bomb Timer
        </h1>
        <p>How long can you defuse the bomb before it explodes?</p>
      </header>

      <!-- Bomb Visualizer -->
      <section class="bomb-visualizer">
        <div class="bomb-container" 
             [class.ticking]="isRunning() && timeRemaining() > 10000"
             [class.warning]="isRunning() && timeRemaining() <= 10000 && timeRemaining() > 5000"
             [class.critical]="isRunning() && timeRemaining() <= 5000"
             [class.exploded]="isExploded()"
             [class.defused]="isDefused()">
          <div class="bomb-body">
            <div class="bomb-display">
              <app-time-display
                [time]="formattedTime()"
                [status]="timerStatus()"
                size="large"
                [animate]="isRunning()">
              </app-time-display>
            </div>
            
            <div class="bomb-details">
              <div class="bomb-label">BOMB-A-LOT</div>
              <div class="serial-number">SN: {{ serialNumber() }}</div>
            </div>
            
            <div class="bomb-wires">
              <div class="wire red"></div>
              <div class="wire blue"></div>
              <div class="wire yellow"></div>
              <div class="wire green"></div>
            </div>
          </div>
          
          <div class="bomb-cap"></div>
          <div class="bomb-shadow"></div>
        </div>
      </section>

      <!-- Timer Controls -->
      <section class="timer-section">
        <mat-card class="timer-card">
          <mat-card-content>
            <mat-progress-bar 
              mode="determinate" 
              [value]="progress()"
              class="timer-progress"
              [class.warning]="timeRemaining() <= 10000 && timeRemaining() > 5000"
              [class.critical]="timeRemaining() <= 5000">
            </mat-progress-bar>
            
            <div class="timer-controls">
              <button 
                mat-raised-button 
                color="primary"
                (click)="startTimer()"
                [disabled]="isRunning() || timeRemaining() === 0"
                *ngIf="!isExploded() && !isDefused()">
                <mat-icon>play_arrow</mat-icon>
                Arm Bomb
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
                *ngIf="isRunning() || isExploded() || isDefused() || timeRemaining() < initialTime()">
                <mat-icon>replay</mat-icon>
                Reset
              </button>
              
              <button 
                mat-raised-button 
                color="primary"
                (click)="defuseBomb()"
                *ngIf="isRunning() && !isExploded() && !isDefused()">
                <mat-icon>check</mat-icon>
                Defuse Bomb
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Setup Section -->
      <section class="setup-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>settings</mat-icon>
              Bomb Settings
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="setup-controls">
              <mat-form-field appearance="fill">
                <mat-label>Minutes</mat-label>
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="setupMinutes" 
                  min="1" 
                  max="59"
                  [disabled]="isRunning()">
              </mat-form-field>
              
              <mat-form-field appearance="fill">
                <mat-label>Seconds</mat-label>
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="setupSeconds" 
                  min="0" 
                  max="59"
                  [disabled]="isRunning()">
              </mat-form-field>
              
              <button 
                mat-raised-button 
                (click)="setBombTime()"
                [disabled]="isRunning() || (setupMinutes === 0 && setupSeconds === 0)">
                Set Timer
              </button>
            </div>
            
            <div class="difficulty-controls">
              <h3>Difficulty Level</h3>
              <div class="difficulty-buttons">
                <button 
                  mat-stroked-button
                  [class.active]="difficulty() === 'easy'"
                  (click)="setDifficulty('easy')"
                  [disabled]="isRunning()">
                  Easy (30s)
                </button>
                <button 
                  mat-stroked-button
                  [class.active]="difficulty() === 'medium'"
                  (click)="setDifficulty('medium')"
                  [disabled]="isRunning()">
                  Medium (15s)
                </button>
                <button 
                  mat-stroked-button
                  [class.active]="difficulty() === 'hard'"
                  (click)="setDifficulty('hard')"
                  [disabled]="isRunning()">
                  Hard (5s)
                </button>
              </div>
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
              
              <!-- Instructions Section -->
              <section class="instructions-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>help</mat-icon>
              How to Defuse
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ol class="instructions-list">
              <li>Set your desired time or choose a difficulty level</li>
              <li>Click "Arm Bomb" to start the countdown</li>
              <li>Watch the bomb display - it gets more dangerous as time runs out</li>
              <li>Click "Defuse Bomb" before time runs out to win</li>
              <li>If time reaches zero, the bomb explodes!</li>
            </ol>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    .bomb-timer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
      color: white;
    }

    .bomb-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .bomb-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: #ff5252;
    }

    .bomb-header p {
      font-size: 1.125rem;
      color: #aaa;
      margin: 0;
    }

    .bomb-visualizer {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .bomb-container {
      position: relative;
      transition: all 0.3s ease;
    }

    .bomb-container.ticking {
      animation: gentle-pulse 2s infinite;
    }

    .bomb-container.warning {
      animation: warning-pulse 0.5s infinite;
    }

    .bomb-container.critical {
      animation: critical-pulse 0.2s infinite;
    }

    .bomb-container.exploded {
      animation: explode 0.5s forwards;
    }

    .bomb-container.defused {
      filter: grayscale(100%);
    }

    @keyframes gentle-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }

    @keyframes warning-pulse {
      0%, 100% { filter: hue-rotate(0deg); }
      50% { filter: hue-rotate(30deg); }
    }

    @keyframes critical-pulse {
      0%, 100% { filter: hue-rotate(0deg) brightness(1); }
      50% { filter: hue-rotate(60deg) brightness(1.5); }
    }

    @keyframes explode {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.5); opacity: 0.8; }
      100% { transform: scale(0); opacity: 0; }
    }

    .bomb-body {
      width: 200px;
      height: 250px;
      background: #333;
      border-radius: 20px;
      position: relative;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
      border: 3px solid #555;
      overflow: hidden;
    }

    .bomb-display {
      background: #000;
      margin: 20px;
      padding: 10px;
      border-radius: 10px;
      border: 2px solid #444;
    }

    .bomb-details {
      text-align: center;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
    }

    .bomb-label {
      font-weight: bold;
      color: #ff5252;
      font-size: 0.9rem;
      margin-bottom: 5px;
    }

    .serial-number {
      color: #aaa;
      font-size: 0.75rem;
    }

    .bomb-wires {
      display: flex;
      justify-content: center;
      gap: 5px;
      margin-top: 20px;
    }

    .wire {
      width: 30px;
      height: 4px;
      border-radius: 2px;
    }

    .wire.red { background: #ff5252; }
    .wire.blue { background: #448aff; }
    .wire.yellow { background: #ffeb3b; }
    .wire.green { background: #69f0ae; }

    .bomb-cap {
      width: 50px;
      height: 20px;
      background: #555;
      border-radius: 10px 10px 0 0;
      margin: 0 auto;
      position: relative;
      top: -10px;
    }

    .bomb-shadow {
      width: 180px;
      height: 20px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 50%;
      margin: 10px auto 0;
      filter: blur(10px);
    }

    .timer-section {
      margin-bottom: 2rem;
    }

    .timer-card {
      background: #222;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      padding: 1rem;
      text-align: center;
      border: 1px solid #444;
    }

    .timer-progress {
      margin: 1rem 0;
      height: 8px;
      border-radius: 4px;
      background: #444;
    }

    .timer-progress.warning ::ng-deep .mdc-linear-progress__bar-inner {
      background-color: #ffeb3b !important;
    }

    .timer-progress.critical ::ng-deep .mdc-linear-progress__bar-inner {
      background-color: #ff5252 !important;
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

    .setup-section {
      margin-bottom: 2rem;
    }

    .setup-controls {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .setup-controls mat-form-field {
      flex: 1;
      min-width: 100px;
    }

    .difficulty-controls {
      text-align: center;
    }

    .difficulty-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .difficulty-buttons button {
      min-width: 100px;
    }

    .difficulty-buttons button.active {
      background: var(--primary-color);
      color: white;
    }

    .instructions-section ol {
      padding-left: 1.5rem;
    }

    .instructions-section li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .bomb-header h1 {
        font-size: 2rem;
      }

      .bomb-body {
        width: 160px;
        height: 200px;
      }

      .timer-controls {
        flex-direction: column;
        align-items: center;
      }

      .timer-controls button {
        width: 100%;
        max-width: 200px;
      }

      .setup-controls {
        flex-direction: column;
      }

      .setup-controls mat-form-field {
        width: 100%;
      }

      .difficulty-buttons {
        flex-direction: column;
      }

      .difficulty-buttons button {
        width: 100%;
        max-width: 200px;
      }
    }

    @media (max-width: 480px) {
      .bomb-timer-container {
        padding: 0.75rem;
      }

      .bomb-body {
        width: 140px;
        height: 180px;
      }
    }
  `]
})
export class BombTimerComponent implements OnInit {
  setupMinutes = 0;
  setupSeconds = 30;

  audioService = inject(AudioService);
  snackBar = inject(MatSnackBar);
  analyticsService = inject(AnalyticsService);
  seoService = inject(SeoService);
  timerService = inject(TimerService);
  backgroundTimerService = inject(BackgroundTimerService);

  // Use centralized state from TimerService
  bombTimerState = this.timerService.bombTimerState;
  
  initialTime = computed(() => this.bombTimerState().initialTime);
  timeRemaining = computed(() => this.bombTimerState().timeRemaining);
  isRunning = computed(() => this.bombTimerState().isRunning);
  isExploded = computed(() => this.bombTimerState().isExploded);
  isDefused = computed(() => this.bombTimerState().isDefused);
  difficulty = computed(() => this.bombTimerState().difficulty);

  serialNumber = computed(() => {
    return 'BMB-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  });

  formattedTime = computed(() => {
    const totalSeconds = Math.ceil(this.timeRemaining() / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  timerStatus = computed(() => {
    if (this.isExploded()) return 'expired';
    if (this.isDefused()) return 'stopped';
    if (this.isRunning()) return 'running';
    return 'stopped';
  });

  progress = computed(() => {
    const initial = this.initialTime();
    const remaining = this.timeRemaining();
    if (initial === 0) return 0;
    return ((initial - remaining) / initial) * 100;
  });

  private lastExplosionTimestamp = 0;
  private lastDefuseTimestamp = 0;

  constructor() {
    // Effect to handle timer completion with intelligent duplicate prevention
    effect(() => {
      const exploded = this.isExploded();
      const defused = this.isDefused();
      const timeRemaining = this.timeRemaining();
      const currentTime = Date.now();
      
      // Handle explosion - only trigger if actually exploded (time reached 0) and not a stale state
      if (exploded && timeRemaining === 0 &&
          (currentTime - this.lastExplosionTimestamp) > 5000) {
        this.lastExplosionTimestamp = currentTime;
        this.onBombExploded();
      }
      
      // Handle defusal - only trigger if actually defused and not a stale state
      if (defused && timeRemaining > 0 &&
          (currentTime - this.lastDefuseTimestamp) > 5000) {
        this.lastDefuseTimestamp = currentTime;
        this.onBombDefused();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Only set default if no timer is already configured
    if (this.initialTime() === 0) {
      // Set initial time based on difficulty without auto-starting
      const level = this.difficulty();
      let timeMs: number;
      
      switch (level) {
        case 'easy':
          this.setupMinutes = 0;
          this.setupSeconds = 30;
          timeMs = 30000;
          break;
        case 'hard':
          this.setupMinutes = 0;
          this.setupSeconds = 5;
          timeMs = 5000;
          break;
        default: // medium
          this.setupMinutes = 0;
          this.setupSeconds = 15;
          timeMs = 15000;
          break;
      }
      
      this.timerService.setBombTimerTime(timeMs, level);
      this.timerService.saveTimerStates();
    }
    
    // Set initial SEO metadata
    this.seoService.updateTimerToolSeo('Bomb Timer (Medium)', '15 Second');
  }

  setBombTime(): void {
    const timeMs = (this.setupMinutes * 60 + this.setupSeconds) * 1000;
    if (timeMs > 0) {
      this.timerService.setBombTimerTime(timeMs, this.difficulty());
      this.timerService.saveTimerStates();
      
      // Update SEO metadata
      const minutes = this.setupMinutes;
      const seconds = this.setupSeconds;
      let duration = '';
      
      if (minutes > 0 && seconds > 0) {
        duration = `${minutes} Minute ${seconds} Second`;
      } else if (minutes > 0) {
        duration = `${minutes} Minute`;
      } else {
        duration = `${seconds} Second`;
      }
      
      this.seoService.updateTimerToolSeo('Bomb Timer', duration);
    }
  }

  setDifficulty(level: 'easy' | 'medium' | 'hard'): void {
    switch (level) {
      case 'easy':
        this.setupMinutes = 0;
        this.setupSeconds = 30;
        break;
      case 'medium':
        this.setupMinutes = 0;
        this.setupSeconds = 15;
        break;
      case 'hard':
        this.setupMinutes = 0;
        this.setupSeconds = 5;
        break;
    }
    
    this.setBombTime();
    
    // Update SEO metadata with difficulty level
    let duration = '';
    switch (level) {
      case 'easy':
        duration = '30 Second';
        break;
      case 'medium':
        duration = '15 Second';
        break;
      case 'hard':
        duration = '5 Second';
        break;
    }
    
    this.seoService.updateTimerToolSeo(`Bomb Timer (${level.charAt(0).toUpperCase() + level.slice(1)})`, duration);
  }

  startTimer(): void {
    if (this.timeRemaining() > 0) {
      this.timerService.startBombTimer();
      this.audioService.playSuccess();
      this.timerService.saveTimerStates();
      
      // Track timer start
      const durationSeconds = Math.ceil(this.initialTime() / 1000);
      this.analyticsService.trackTimerStart('bomb-timer', durationSeconds);
    }
  }

  pauseTimer(): void {
    this.timerService.stopBombTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer pause
    const elapsedSeconds = Math.ceil((this.initialTime() - this.timeRemaining()) / 1000);
    this.analyticsService.trackTimerPause('bomb-timer', elapsedSeconds);
  }

  resetTimer(): void {
    this.timerService.resetBombTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer reset
    this.analyticsService.trackTimerReset('bomb-timer');
  }

  defuseBomb(): void {
    if (this.isRunning()) {
      this.timerService.defuseBomb();
      this.audioService.playPattern('success');
      this.timerService.saveTimerStates();
      
      // Track successful defuse
      const durationSeconds = Math.ceil(this.initialTime() / 1000);
      this.analyticsService.trackTimerComplete('bomb-timer-defuse', durationSeconds);
    }
  }

  private onBombExploded(): void {
    this.audioService.playPattern('error');
    
    // Track bomb explosion
    const durationSeconds = Math.ceil(this.initialTime() / 1000);
    this.analyticsService.trackTimerComplete('bomb-timer-explode', durationSeconds);
    
    // Show explosion notification
    this.snackBar.open('💥 BOOM! The bomb exploded!', 'Try Again', {
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.resetTimer();
    });
  }

  private onBombDefused(): void {
    // Show success notification
    this.snackBar.open('✅ Bomb defused! You saved the day!', 'Awesome', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }
}