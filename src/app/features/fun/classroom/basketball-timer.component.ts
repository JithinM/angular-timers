import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AudioService } from '../../../core/services/audio.service';
import { TimeDisplayComponent } from '../../../shared/components/time-display/time-display.component';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SeoService } from '../../../core/services/seo.service';
import { TimerService } from '../../../core/services/timer.service';
import { BackgroundTimerService } from '../../../core/services/background-timer.service';

@Component({
  selector: 'app-basketball-timer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    TimeDisplayComponent,
    AdSlotComponent
  ],
  templateUrl: './basketball-timer.component.html',
  styleUrls: ['./basketball-timer.component.scss']
})
export class BasketballTimerComponent implements OnInit, OnDestroy {
  periodMinutes = 12;
  setupPeriods = 4;

  audioService = inject(AudioService);
  snackBar = inject(MatSnackBar);
  seoService = inject(SeoService);
  analyticsService = inject(AnalyticsService);
  timerService = inject(TimerService);
  backgroundTimerService = inject(BackgroundTimerService);

  // Use centralized state from TimerService
  basketballTimerState = this.timerService.basketballTimerState;
  
  periodDuration = computed(() => this.basketballTimerState().periodDuration);
  timeRemaining = computed(() => this.basketballTimerState().timeRemaining);
  isRunning = computed(() => this.basketballTimerState().isRunning);
  currentPeriod = computed(() => this.basketballTimerState().currentPeriod);
  totalPeriods = computed(() => this.basketballTimerState().totalPeriods);
  homeScore = computed(() => this.basketballTimerState().homeScore);
  awayScore = computed(() => this.basketballTimerState().awayScore);

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
  isFullscreen = false;
  private keyboardHandler = this.onKeyDown.bind(this);

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
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.keyboardHandler);
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    // Only apply default settings if no existing timer state
    if (this.basketballTimerState().periodDuration === 0) {
      this.applySettings();
    }
    
    // Set initial SEO metadata
    this.seoService.updateTimerToolSeo('Basketball Timer', '12 Minute');
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keyboardHandler);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    this.exitFullscreen();
  }

  applySettings(): void {
    const timeMs = this.periodMinutes * 60 * 1000;
    this.timerService.setupBasketballTimer(timeMs, this.setupPeriods);
    this.timerService.saveTimerStates();
    
    // Update SEO metadata
    this.seoService.updateTimerToolSeo('Basketball Timer', `${this.periodMinutes} Minute`);
  }

  // Fullscreen methods
  toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  private enterFullscreen(): void {
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        if (('orientation' in screen) && (screen as any).orientation?.lock) {
          (screen as any).orientation.lock('landscape').catch(() => {});
        }
      }).catch(() => {});
    }
  }

  private exitFullscreen(): void {
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().finally(() => {
        if (('orientation' in screen) && (screen as any).orientation?.unlock) {
          try { (screen as any).orientation.unlock(); } catch (_) {}
        }
      });
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    switch (event.key.toLowerCase()) {
      case 'f':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      case 'escape':
        if (this.isFullscreen) {
          event.preventDefault();
          this.exitFullscreen();
        }
        break;
    }
  }

  private handleFullscreenChange = (): void => {
    this.isFullscreen = typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  };

  setPreset(minutes: number, periods: number): void {
    this.periodMinutes = minutes;
    this.setupPeriods = periods;
    this.applySettings();
    
    // Update SEO metadata with preset info
    this.seoService.updateTimerToolSeo(`Basketball Timer (${minutes} min × ${periods})`, `${minutes} Minute`);
  }

  startPeriod(): void {
    if (this.timeRemaining() > 0) {
      this.timerService.startBasketballTimer();
      this.audioService.playSuccess();
      this.timerService.saveTimerStates();
      
      // Track timer start
      const durationSeconds = Math.ceil(this.periodDuration() / 1000);
      this.analyticsService.trackTimerStart('basketball-timer', durationSeconds);
    }
  }

  pausePeriod(): void {
    this.timerService.stopBasketballTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer pause
    const elapsedSeconds = Math.ceil((this.periodDuration() - this.timeRemaining()) / 1000);
    this.analyticsService.trackTimerPause('basketball-timer', elapsedSeconds);
  }

  resetPeriod(): void {
    this.timerService.resetBasketballTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer reset
    this.analyticsService.trackTimerReset('basketball-timer');
  }

  private onPeriodComplete(): void {
    this.audioService.playPattern('completion');
    
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
      // Move to next period by updating the state manually
      this.timerService.setupBasketballTimer(this.periodDuration(), this.totalPeriods());
      this.timerService.updateBasketballScore('home', 0); // Keep current scores
      this.timerService.updateBasketballScore('away', 0);
      this.resetPeriod();
      
      // Track next period
      this.analyticsService.trackTimerStart('basketball-timer-next-period', 0);
      
      this.snackBar.open(`🏀 Starting Period ${this.currentPeriod()}`, '', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    } else {
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
    this.timerService.stopBasketballTimer();
    
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
    this.timerService.setupBasketballTimer(this.periodDuration(), this.totalPeriods());
    this.resetPeriod();
  }

  increaseScore(team: 'home' | 'away'): void {
    this.timerService.updateBasketballScore(team, 1);
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
  }

  decreaseScore(team: 'home' | 'away'): void {
    this.timerService.updateBasketballScore(team, -1);
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
  }
}