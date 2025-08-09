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
  templateUrl: './bomb-timer.component.html',
  styleUrls: ['./bomb-timer.component.scss']
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