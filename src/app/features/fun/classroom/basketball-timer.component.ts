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

@Component({
  selector: 'app-basketball-timer',
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
    <div class="basketball-timer-container">
      <!-- Header -->
      <header class="basketball-header">
        <h1>
          <mat-icon>sports_basketball</mat-icon>
          Basketball Timer
        </h1>
        <p>Perfect for classroom basketball games and activities</p>
      </header>

      <!-- Court Visualizer -->
      <section class="court-visualizer">
        <div class="court-container">
          <div class="court">
            <!-- Basketball Court -->
            <div class="court-lines">
              <div class="center-circle"></div>
              <div class="free-throw-line"></div>
              <div class="free-throw-circle"></div>
              <div class="key"></div>
              <div class="backboard"></div>
              <div class="hoop"></div>
            </div>
            
            <!-- Timer Display on Court -->
            <div class="court-timer-display">
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
                  [class.active]="periodMinutes === 8 && setupPeriods === 4"
                  (click)="setPreset(8, 4)"
                  [disabled]="isRunning()">
                  Middle School (8 min × 4)
                </button>
                <button 
                  mat-stroked-button
                  [class.active]="periodMinutes === 12 && setupPeriods === 4"
                  (click)="setPreset(12, 4)"
                  [disabled]="isRunning()">
                  High School (12 min × 4)
                </button>
                <button 
                  mat-stroked-button
                  [class.active]="periodMinutes === 20 && setupPeriods === 2"
                  (click)="setPreset(20, 2)"
                  [disabled]="isRunning()">
                  College (20 min × 2)
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Score Tracking -->
      <section class="score-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>score</mat-icon>
              Score Tracker
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="score-display">
              <div class="team-score">
                <span class="team-name">Home</span>
                <div class="score-controls">
                  <button mat-icon-button (click)="decreaseScore('home')">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="score">{{ homeScore() }}</span>
                  <button mat-icon-button (click)="increaseScore('home')">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
              </div>
              
              <div class="vs-divider">VS</div>
              
              <div class="team-score">
                <span class="team-name">Away</span>
                <div class="score-controls">
                  <button mat-icon-button (click)="decreaseScore('away')">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <span class="score">{{ awayScore() }}</span>
                  <button mat-icon-button (click)="increaseScore('away')">
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
              <li>Use the score tracker to keep track of points</li>
              <li>When time expires, click "Next Period" to continue</li>
              <li>After all periods, click "End Game" to finish</li>
            </ol>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    .basketball-timer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      color: white;
    }

    .basketball-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .basketball-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: #ffeb3b;
    }

    .basketball-header p {
      font-size: 1.125rem;
      color: #e8f5e9;
      margin: 0;
    }

    .court-visualizer {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .court-container {
      width: 100%;
      max-width: 500px;
    }

    .court {
      position: relative;
      width: 100%;
      height: 200px;
      background: #8bc34a;
      border: 3px solid #fff;
      border-radius: 10px;
      overflow: hidden;
    }

    .court-lines {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .center-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border: 2px solid #fff;
      border-radius: 50%;
    }

    .free-throw-line {
      position: absolute;
      top: 50%;
      right: 20px;
      width: 80px;
      height: 2px;
      background: #fff;
      transform: translateY(-50%);
    }

    .free-throw-circle {
      position: absolute;
      top: 50%;
      right: 100px;
      width: 40px;
      height: 40px;
      border: 2px solid #fff;
      border-radius: 50%;
      transform: translateY(-50%);
    }

    .key {
      position: absolute;
      top: 50%;
      right: 20px;
      width: 120px;
      height: 80px;
      border: 2px solid #fff;
      transform: translateY(-50%);
    }

    .backboard {
      position: absolute;
      top: 50%;
      right: 10px;
      width: 4px;
      height: 40px;
      background: #fff;
      transform: translateY(-50%);
    }

    .hoop {
      position: absolute;
      top: 50%;
      right: 14px;
      width: 24px;
      height: 24px;
      border: 2px solid #ff5722;
      border-radius: 50%;
      transform: translateY(-50%);
    }

    .court-timer-display {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.7);
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
      color: #e8f5e9;
    }

    .period-number {
      font-size: 1.5rem;
      font-weight: bold;
      color: #ffeb3b;
    }

    .period-max {
      color: #c8e6c9;
    }

    .period-progress {
      margin: 1rem 0;
      height: 8px;
      border-radius: 4px;
      background: #388e3c;
    }

    .game-card {
      background: #388e3c;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      padding: 1rem;
      text-align: center;
      border: 1px solid #4caf50;
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

    .score-section {
      margin-bottom: 2rem;
    }

    .score-display {
      display: flex;
      justify-content: space-around;
      align-items: center;
      gap: 1rem;
    }

    .team-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .team-name {
      font-weight: 500;
      font-size: 1.125rem;
    }

    .score-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .score {
      font-size: 2rem;
      font-weight: bold;
      min-width: 60px;
      text-align: center;
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
      .basketball-header h1 {
        font-size: 2rem;
      }

      .court {
        height: 150px;
      }

      .score-display {
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
      .basketball-timer-container {
        padding: 0.75rem;
      }

      .court {
        height: 120px;
      }
    }
  `]
})
export class BasketballTimerComponent implements OnInit {
  periodDuration = signal(12 * 60 * 1000); // 12 minutes default
  timeRemaining = signal(12 * 60 * 1000);
  isRunning = signal(false);
  currentPeriod = signal(1);
  totalPeriods = signal(4);
  homeScore = signal(0);
  awayScore = signal(0);
  
  periodMinutes = 12;
  setupPeriods = 4;
  
  private intervalId: any;

  audioService = inject(AudioService);
  snackBar = inject(MatSnackBar);
  seoService = inject(SeoService);
  analyticsService = inject(AnalyticsService);

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

  ngOnInit(): void {
    // Initialize with default settings
    this.applySettings();
    
    // Set initial SEO metadata
    this.seoService.updateTimerToolSeo('Basketball Timer', '12 Minute');
  }

  applySettings(): void {
    const timeMs = this.periodMinutes * 60 * 1000;
    this.periodDuration.set(timeMs);
    this.timeRemaining.set(timeMs);
    this.totalPeriods.set(this.setupPeriods);
    
    if (this.currentPeriod() > this.setupPeriods) {
      this.currentPeriod.set(this.setupPeriods);
    }
    
    // Update SEO metadata
    this.seoService.updateTimerToolSeo('Basketball Timer', `${this.periodMinutes} Minute`);
  }

  setPreset(minutes: number, periods: number): void {
    this.periodMinutes = minutes;
    this.setupPeriods = periods;
    this.applySettings();
    
    // Update SEO metadata with preset info
    this.seoService.updateTimerToolSeo(`Basketball Timer (${minutes} min × ${periods})`, `${minutes} Minute`);
  }

  startPeriod(): void {
    if (this.timeRemaining() > 0) {
      this.isRunning.set(true);
      this.audioService.playSuccess();
      
      // Track timer start
      const durationSeconds = Math.ceil(this.periodDuration() / 1000);
      this.analyticsService.trackTimerStart('basketball-timer', durationSeconds);
      
      // Start countdown timer
      this.intervalId = setInterval(() => {
        const newTime = Math.max(0, this.timeRemaining() - 100);
        this.timeRemaining.set(newTime);
        
        // Play warning sounds at key intervals
        if (newTime <= 60000 && newTime > 59900) {
          this.audioService.playWarning();
        } else if (newTime <= 30000 && newTime > 29900) {
          this.audioService.playWarning();
        } else if (newTime <= 10000 && newTime > 9900) {
          this.audioService.playWarning();
        }
        
        if (newTime === 0) {
          this.endPeriod();
          
          // Track period completion
          this.analyticsService.trackTimerComplete('basketball-timer-period', durationSeconds);
        }
      }, 100);
    }
  }

  pausePeriod(): void {
    this.isRunning.set(false);
    this.audioService.playButtonClick();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Track timer pause
    const elapsedSeconds = Math.ceil((this.periodDuration() - this.timeRemaining()) / 1000);
    this.analyticsService.trackTimerPause('basketball-timer', elapsedSeconds);
  }

  resetPeriod(): void {
    this.isRunning.set(false);
    this.timeRemaining.set(this.periodDuration());
    this.audioService.playButtonClick();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Track timer reset
    this.analyticsService.trackTimerReset('basketball-timer');
  }

  endPeriod(): void {
    this.isRunning.set(false);
    this.audioService.playPattern('completion');
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Track period completion
    const durationSeconds = Math.ceil(this.periodDuration() / 1000);
    this.analyticsService.trackTimerComplete('basketball-timer-period-end', durationSeconds);
    
    // Show period end notification
    this.snackBar.open(`🏀 Period ${this.currentPeriod()} ended!`, 'Next', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.nextPeriod();
    });
  }

  nextPeriod(): void {
    if (this.currentPeriod() < this.totalPeriods()) {
      this.currentPeriod.update(p => p + 1);
      this.resetPeriod();
      
      // Track next period
      this.analyticsService.trackTimerStart('basketball-timer-next-period', 0);
      
      this.snackBar.open(`🏀 Starting Period ${this.currentPeriod()}`, '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } else {
      this.currentPeriod.update(p => p + 1);
      
      // Track game completion
      this.analyticsService.trackTimerComplete('basketball-timer-game-complete', 0);
      
      this.snackBar.open('🎉 Game complete! Great job!', 'Finish', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  endGame(): void {
    this.isRunning.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    const home = this.homeScore();
    const away = this.awayScore();
    let result = '';
    
    if (home > away) {
      result = 'Home team wins!';
    } else if (away > home) {
      result = 'Away team wins!';
    } else {
      result = 'It\'s a tie!';
    }
    
    // Track game end
    this.analyticsService.trackTimerComplete('basketball-timer-game-end', 0);
    
    this.snackBar.open(`🏆 ${result} Final Score: Home ${home} - ${away} Away`, 'Play Again', {
      duration: 15000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.resetGame();
    });
  }

  private resetGame(): void {
    this.currentPeriod.set(1);
    this.homeScore.set(0);
    this.awayScore.set(0);
    this.resetPeriod();
  }

  increaseScore(team: 'home' | 'away'): void {
    if (team === 'home') {
      this.homeScore.update(s => s + 1);
    } else {
      this.awayScore.update(s => s + 1);
    }
    this.audioService.playButtonClick();
  }

  decreaseScore(team: 'home' | 'away'): void {
    if (team === 'home') {
      this.homeScore.update(s => Math.max(0, s - 1));
    } else {
      this.awayScore.update(s => Math.max(0, s - 1));
    }
    this.audioService.playButtonClick();
  }
}