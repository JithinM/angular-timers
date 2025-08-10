import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTooltipModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule,
    TimeDisplayComponent,
    AdSlotComponent
  ],
  templateUrl: './egg-timer.component.html',
  styleUrls: ['./egg-timer.component.scss']
})
export class EggTimerComponent implements OnInit, OnDestroy {
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
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.keyboardHandler);
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    // Only set default if no timer is already configured
    if (this.initialTime() === 0) {
      // Set default to medium-boiled preset without auto-starting
      const preset = this.presets[1];
      const timeMs = preset.time * 60 * 1000;
      this.timerService.setEggTimerTime(timeMs, preset.name);
      this.timerService.saveTimerStates();
    }
    
    // Set initial SEO metadata
    this.seoService.updateTimerToolSeo('Egg Timer', '6 Minute');
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keyboardHandler);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    this.exitFullscreen();
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
  isFullscreen = false;
  private keyboardHandler = this.onKeyDown.bind(this);

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
}