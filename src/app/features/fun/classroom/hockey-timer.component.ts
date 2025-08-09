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
  templateUrl: './hockey-timer.component.html',
  styleUrls: ['./hockey-timer.component.scss']
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