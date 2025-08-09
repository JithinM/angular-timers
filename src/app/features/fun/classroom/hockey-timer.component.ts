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

import { AudioService } from '../../../core/services/audio.service';
import { TimeDisplayComponent } from '../../../shared/components/time-display/time-display.component';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SeoService } from '../../../core/services/seo.service';
import { TimerService } from '../../../core/services/timer.service';
import { BackgroundTimerService } from '../../../core/services/background-timer.service';

@Component({
  selector: 'app-hockey-timer',
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
    <div class="hockey-timer-container">
      <!-- Header -->
      <header class="hockey-header">
        <h1>
          <mat-icon>sports_hockey</mat-icon>
          Hockey Timer
        </h1>
        <p>Perfect for classroom hockey games and activities</p>
      </header>

      <!-- Rink Visualizer -->
      <section class="rink-visualizer">
        <div class="rink-container">
          <div class="rink">
            <!-- Hockey Rink -->
            <div class="rink-lines">
              <div class="center-line"></div>
              <div class="center-circle"></div>
              <div class="blue-line left"></div>
              <div class="blue-line right"></div>
              <div class="goal-line left"></div>
              <div class="goal-line right"></div>
              <div class="faceoff-circle tl"></div>
              <div class="faceoff-circle tr"></div>
              <div class="faceoff-circle bl"></div>
              <div class="faceoff-circle br"></div>
              <div class="goal left"></div>
              <div class="goal right"></div>
            </div>
            
            <!-- Timer Display on Rink -->
            <div class="rink-timer-display">
              <app-time-display
                [time]="formattedTime()"
                [status]="timerStatus()"
                size="large"
                [animate]="isRunning()">
              </app-time-display>
            </div>
          </div>
        </div>
      </section>

      <!-- Game Controls -->
      <section class="game-section">
        <mat-card class="game-card">
          <mat-card-content>
            <div class="period-display">
              <span class="period-label">Period:</span>
              <span class="period-number">{{ currentPeriod() }}</span>
              <span class="period-max">of {{ totalPeriods() }}</span>
            </div>
            
            <mat-progress-bar 
              mode="determinate" 
              [value]="periodProgress()"
              class="period-progress">
            </mat-progress-bar>
            
            <div class="game-controls">
              <button 
                mat-raised-button 
                color="primary"
                (click)="startPeriod()"
                [disabled]="isRunning() || isPeriodComplete()"
                *ngIf="!isGameOver()">
                <mat-icon>play_arrow</mat-icon>
                Start Period
              </button>
              
              <button 
                mat-raised-button 
                color="accent"
                (click)="pausePeriod()"
                *ngIf="isRunning()">
                <mat-icon>pause</mat-icon>
                Pause
              </button>
              
              <button 
                mat-raised-button 
                color="warn"
                (click)="resetPeriod()"
                *ngIf="isRunning() || isPeriodComplete() || timeRemaining() < periodDuration()">
                <mat-icon>replay</mat-icon>
                Reset Period
              </button>
              
              <button 
                mat-raised-button 
                color="primary"
                (click)="nextPeriod()"
                *ngIf="isPeriodComplete() && !isGameOver()">
                <mat-icon>skip_next</mat-icon>
                Next Period
              </button>
              
              <button 
                mat-raised-button 
                color="warn"
                (click)="endGame()"
                *ngIf="isGameOver()">
                <mat-icon>flag</mat-icon>
                End Game
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
              Game Settings
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="setup-controls">
              <mat-form-field appearance="fill">
                <mat-label>Period Duration (minutes)</mat-label>
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="periodMinutes" 
                  min="1" 
                  max="60"
                  [disabled]="isRunning()">
              </mat-form-field>
              
              <mat-form-field appearance="fill">
                <mat-label>Total Periods</mat-label>
                <input 
                  matInput 
                  type="number" 
                  [(ngModel)]="setupPeriods" 
                  min="1" 
                  max="10"
                  [disabled]="isRunning()">
              </mat-form-field>
              
              <button 
                mat-raised-button 
                (click)="applySettings()"
                [disabled]="isRunning()">
                Apply Settings
              </button>
            </div>
            
            <div class="preset-controls">
              <h3>Quick Presets</h3>
              <div class="preset-buttons">
                <button 
                  mat-stroked-button
                  [class.active]="periodMinutes === 12 && setupPeriods === 3"
                  (click)="setPreset(12, 3)"
                  [disabled]="isRunning()">
                  Youth Hockey (12 min × 3)
                </button>
                <button 
                  mat-stroked-button
                  [class.active]="periodMinutes === 15 && setupPeriods === 3"
                  (click)="setPreset(15, 3)"
                  [disabled]="isRunning()">
                  High School (15 min × 3)
                </button>
                <button 
                  mat-stroked-button
                  [class.active]="periodMinutes === 20 && setupPeriods === 3"
                  (click)="setPreset(20, 3)"
                  [disabled]="isRunning()">
                  Professional (20 min × 3)
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Penalty Tracker -->
      <section class="penalty-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>gavel</mat-icon>
              Penalty Tracker
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="penalty-display">
              <div class="team-penalties">
                <span class="team-name">Home</span>
                <div class="penalty-controls">
                  <button mat-icon-button (click)="removePenalty('home')">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="penalty-count">{{ homePenalties() }}</span>
                  <button mat-icon-button (click)="addPenalty('home')">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
              </div>
              
              <div class="vs-divider">VS</div>
              
              <div class="team-penalties">
                <span class="team-name">Away</span>
                <div class="penalty-controls">
                  <button mat-icon-button (click)="removePenalty('away')">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="penalty-count">{{ awayPenalties() }}</span>
                  <button mat-icon-button (click)="addPenalty('away')">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
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
              How to Use
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ol class="instructions-list">
              <li>Set the period duration and total periods for your game</li>
              <li>Click "Start Period" to begin timing</li>
              <li>Use the penalty tracker to keep track of infractions</li>
              <li>When time expires, click "Next Period" to continue</li>
              <li>After all periods, click "End Game" to finish</li>
            </ol>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    .hockey-timer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #2196f3 0%, #0d47a1 100%);
      color: white;
    }

    .hockey-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .hockey-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: #ffeb3b;
    }

    .hockey-header p {
      font-size: 1.125rem;
      color: #e3f2fd;
      margin: 0;
    }

    .rink-visualizer {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .rink-container {
      width: 100%;
      max-width: 500px;
    }

    .rink {
      position: relative;
      width: 100%;
      height: 200px;
      background: #e3f2fd;
      border: 3px solid #1976d2;
      border-radius: 10px;
      overflow: hidden;
    }

    .rink-lines {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .center-line {
      position: absolute;
      top: 0;
      left: 50%;
      width: 3px;
      height: 100%;
      background: #1976d2;
      transform: translateX(-50%);
    }

    .center-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border: 2px solid #1976d2;
      border-radius: 50%;
    }

    .blue-line {
      position: absolute;
      top: 0;
      width: 3px;
      height: 100%;
      background: #2196f3;
    }

    .blue-line.left {
      left: 25%;
    }

    .blue-line.right {
      right: 25%;
    }

    .goal-line {
      position: absolute;
      top: 0;
      width: 2px;
      height: 100%;
      background: #f44336;
    }

    .goal-line.left {
      left: 5%;
    }

    .goal-line.right {
      right: 5%;
    }

    .faceoff-circle {
      position: absolute;
      width: 30px;
      height: 30px;
      border: 1px solid #1976d2;
      border-radius: 50%;
    }

    .faceoff-circle.tl {
      top: 25%;
      left: 25%;
    }

    .faceoff-circle.tr {
      top: 25%;
      right: 25%;
    }

    .faceoff-circle.bl {
      bottom: 25%;
      left: 25%;
    }

    .faceoff-circle.br {
      bottom: 25%;
      right: 25%;
    }

    .goal {
      position: absolute;
      top: 50%;
      width: 4px;
      height: 40px;
      background: #f44336;
      transform: translateY(-50%);
    }

    .goal.left {
      left: 0;
    }

    .goal.right {
      right: 0;
    }

    .rink-timer-display {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(13, 71, 161, 0.9);
      padding: 5px 15px;
      border-radius: 20px;
      border: 2px solid #ffeb3b;
    }

    .game-section {
      margin-bottom: 2rem;
    }

    .period-display {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .period-label {
      color: #e3f2fd;
    }

    .period-number {
      font-size: 1.5rem;
      font-weight: bold;
      color: #ffeb3b;
    }

    .period-max {
      color: #bbdefb;
    }

    .period-progress {
      margin: 1rem 0;
      height: 8px;
      border-radius: 4px;
      background: #1565c0;
    }

    .game-card {
      background: #1565c0;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      padding: 1rem;
      text-align: center;
      border: 1px solid #2196f3;
    }

    .game-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .game-controls button {
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
      min-width: 120px;
    }

    .preset-controls {
      text-align: center;
    }

    .preset-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .preset-buttons button {
      min-width: 150px;
    }

    .preset-buttons button.active {
      background: #ffeb3b;
      color: #333;
    }

    .penalty-section {
      margin-bottom: 2rem;
    }

    .penalty-display {
      display: flex;
      justify-content: space-around;
      align-items: center;
      gap: 1rem;
    }

    .team-penalties {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .team-name {
      font-weight: 500;
      font-size: 1.125rem;
    }

    .penalty-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .penalty-count {
      font-size: 2rem;
      font-weight: bold;
      min-width: 60px;
      text-align: center;
      color: #f44336;
    }

    .vs-divider {
      font-size: 1.5rem;
      font-weight: bold;
      color: #ffeb3b;
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
      .hockey-header h1 {
        font-size: 2rem;
      }

      .rink {
        height: 150px;
      }

      .penalty-display {
        flex-direction: column;
        gap: 1rem;
      }

      .game-controls {
        flex-direction: column;
        align-items: center;
      }

      .game-controls button {
        width: 100%;
        max-width: 200px;
      }

      .setup-controls {
        flex-direction: column;
      }

      .setup-controls mat-form-field {
        width: 100%;
      }

      .preset-buttons {
        flex-direction: column;
      }

      .preset-buttons button {
        width: 100%;
        max-width: 200px;
      }
    }

    @media (max-width: 480px) {
      .hockey-timer-container {
        padding: 0.75rem;
      }

      .rink {
        height: 120px;
      }
    }
  `]
})
export class HockeyTimerComponent implements OnInit {
  periodMinutes = 15;
  setupPeriods = 3;

  audioService = inject(AudioService);
  snackBar = inject(MatSnackBar);
  seoService = inject(SeoService);
  analyticsService = inject(AnalyticsService);
  timerService = inject(TimerService);
  backgroundTimerService = inject(BackgroundTimerService);

  // Use centralized state from TimerService
  hockeyTimerState = this.timerService.hockeyTimerState;
  
  periodDuration = computed(() => this.hockeyTimerState().periodDuration);
  timeRemaining = computed(() => this.hockeyTimerState().timeRemaining);
  isRunning = computed(() => this.hockeyTimerState().isRunning);
  currentPeriod = computed(() => this.hockeyTimerState().currentPeriod);
  totalPeriods = computed(() => this.hockeyTimerState().totalPeriods);
  homePenalties = computed(() => this.hockeyTimerState().homePenalties);
  awayPenalties = computed(() => this.hockeyTimerState().awayPenalties);

  formattedTime = computed(() => {
    const totalSeconds = Math.ceil(this.timeRemaining() / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  timerStatus = computed(() => {
    if (this.isPeriodComplete()) return 'expired';
    if (this.isRunning()) return 'running';
    return 'stopped';
  });

  periodProgress = computed(() => {
    const initial = this.periodDuration();
    const remaining = this.timeRemaining();
    if (initial === 0) return 0;
    return ((initial - remaining) / initial) * 100;
  });

  isPeriodComplete = computed(() => {
    return this.timeRemaining() === 0 && this.periodDuration() > 0;
  });

  isGameOver = computed(() => {
    return this.currentPeriod() > this.totalPeriods();
  });

  private lastCompletionTimestamp = 0;

  constructor() {
    // Effect to handle period completion with intelligent duplicate prevention
    effect(() => {
      const periodComplete = this.isPeriodComplete();
      const timeRemaining = this.timeRemaining();
      const currentTime = Date.now();
      
      // Only trigger completion if actually completed (time reached 0) and not a stale state
      if (periodComplete && timeRemaining === 0 &&
          (currentTime - this.lastCompletionTimestamp) > 5000) {
        this.lastCompletionTimestamp = currentTime;
        this.onPeriodComplete();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Only apply default settings if no existing timer state
    if (this.hockeyTimerState().periodDuration === 0) {
      this.applySettings();
    }
    
    // Set initial SEO metadata
    this.seoService.updateTimerToolSeo('Hockey Timer', '15 Minute');
  }

  applySettings(): void {
    const timeMs = this.periodMinutes * 60 * 1000;
    this.timerService.setupHockeyTimer(timeMs, this.setupPeriods);
    this.timerService.saveTimerStates();
    
    // Update SEO metadata
    this.seoService.updateTimerToolSeo('Hockey Timer', `${this.periodMinutes} Minute`);
  }

  setPreset(minutes: number, periods: number): void {
    this.periodMinutes = minutes;
    this.setupPeriods = periods;
    this.applySettings();
    
    // Update SEO metadata with preset info
    this.seoService.updateTimerToolSeo(`Hockey Timer (${minutes} min × ${periods})`, `${minutes} Minute`);
  }

  startPeriod(): void {
    if (this.timeRemaining() > 0) {
      this.timerService.startHockeyTimer();
      this.audioService.playSuccess();
      this.timerService.saveTimerStates();
      
      // Track timer start
      const durationSeconds = Math.ceil(this.periodDuration() / 1000);
      this.analyticsService.trackTimerStart('hockey-timer', durationSeconds);
    }
  }

  pausePeriod(): void {
    this.timerService.stopHockeyTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer pause
    const elapsedSeconds = Math.ceil((this.periodDuration() - this.timeRemaining()) / 1000);
    this.analyticsService.trackTimerPause('hockey-timer', elapsedSeconds);
  }

  resetPeriod(): void {
    this.timerService.resetHockeyTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer reset
    this.analyticsService.trackTimerReset('hockey-timer');
  }

  private onPeriodComplete(): void {
    this.audioService.playPattern('completion');
    
    // Track period completion
    const durationSeconds = Math.ceil(this.periodDuration() / 1000);
    this.analyticsService.trackTimerComplete('hockey-timer-period-end', durationSeconds);
    
    // Show period end notification
    this.snackBar.open(`🏒 Period ${this.currentPeriod()} ended!`, 'Next', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.nextPeriod();
    });
  }

  nextPeriod(): void {
    if (this.currentPeriod() < this.totalPeriods()) {
      // Move to next period by updating the state manually
      this.timerService.setupHockeyTimer(this.periodDuration(), this.totalPeriods());
      this.timerService.updateHockeyPenalties('home', 0); // Keep current penalties
      this.timerService.updateHockeyPenalties('away', 0);
      this.resetPeriod();
      
      // Track next period
      this.analyticsService.trackTimerStart('hockey-timer-next-period', 0);
      
      this.snackBar.open(`🏒 Starting Period ${this.currentPeriod()}`, '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } else {
      // Track game completion
      this.analyticsService.trackTimerComplete('hockey-timer-game-complete', 0);
      
      this.snackBar.open('🎉 Game complete! Great job!', 'Finish', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  endGame(): void {
    this.timerService.stopHockeyTimer();
    
    // Track game end
    this.analyticsService.trackTimerComplete('hockey-timer-game-end', 0);
    
    this.snackBar.open('🏆 Hockey game ended!', 'Play Again', {
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.resetGame();
    });
  }

  private resetGame(): void {
    this.timerService.setupHockeyTimer(this.periodDuration(), this.totalPeriods());
    this.resetPeriod();
  }

  addPenalty(team: 'home' | 'away'): void {
    this.timerService.updateHockeyPenalties(team, 1);
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
  }

  removePenalty(team: 'home' | 'away'): void {
    this.timerService.updateHockeyPenalties(team, -1);
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
  }
}