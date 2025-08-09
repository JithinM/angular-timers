import { Component, OnInit, OnDestroy, signal, computed, effect, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Services
import { TimerService } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { StorageService } from '../../core/services/storage.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';
import { TimerStoreService } from '../../core/services/timer-store.service';

// Shared components
import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { ControlButtonsComponent } from '../../shared/components/control-buttons/control-buttons.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

interface CountdownPreset {
  name: string;
  minutes: number;
  description?: string;
}

@Component({
  selector: 'app-countdown',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressBarModule,
    TimeDisplayComponent,
    ControlButtonsComponent,
    AdSlotComponent
  ],
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss']
})
export class CountdownComponent implements OnInit, OnDestroy {
  private readonly timerService = inject(TimerService);
  private readonly audioService = inject(AudioService);
  private readonly storageService = inject(StorageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly backgroundTimerService = inject(BackgroundTimerService);
  private readonly timerStore = inject(TimerStoreService);
  private readonly destroyRef = inject(DestroyRef);

  // Component state
  isFullscreen = false;
  showSetup = signal(true);
  customMinutes = signal(5);
  customSeconds = signal(0);
  selectedPreset = signal<CountdownPreset | null>(null);

  // Computed values
  timerState = this.timerService.countdownState;
  progress = computed(() => {
    const state = this.timerState();
    if (state.initialTime === 0) return 0;
    return ((state.initialTime - state.timeRemaining) / state.initialTime) * 100;
  });

  timeRemaining = computed(() => this.timerState().timeRemaining);
  isRunning = computed(() => this.timerState().isRunning);
  hasTime = computed(() => this.timerState().timeRemaining > 0);
  isFinished = computed(() => this.timerState().timeRemaining === 0 && this.timerState().initialTime > 0);

  // Visual alert states
  showCriticalAlert = computed(() => {
    const remaining = this.timeRemaining();
    return remaining <= 10000 && remaining > 0; // Last 10 seconds
  });

  showUrgentAlert = computed(() => {
    const remaining = this.timeRemaining();
    return remaining <= 60000 && remaining > 10000; // Last minute
  });

  // Preset timers
  presetTimers: CountdownPreset[] = [
    { name: '1 Minute', minutes: 1, description: 'Quick break' },
    { name: '5 Minutes', minutes: 5, description: 'Short focus session' },
    { name: '10 Minutes', minutes: 10, description: 'Medium break' },
    { name: '15 Minutes', minutes: 15, description: 'Standard break' },
    { name: '20 Minutes', minutes: 20, description: 'Focus session' },
    { name: '25 Minutes', minutes: 25, description: 'Pomodoro session' },
    { name: '30 Minutes', minutes: 30, description: 'Long focus' },
    { name: '45 Minutes', minutes: 45, description: 'Deep work' },
    { name: '60 Minutes', minutes: 60, description: 'Extended session' }
  ];

  // Keyboard shortcut handler
  private keyboardHandler = this.onKeyDown.bind(this);

  constructor() {
    // Effects for visual and audio alerts
    effect(() => {
      if (this.isFinished()) {
        this.onTimerFinished();
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.showCriticalAlert()) {
        this.showCriticalNotification();
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.showUrgentAlert()) {
        this.showUrgentNotification();
      }
    }, { allowSignalWrites: true });

    // Listen for timer cancellations from store
    this.timerStore.runningTimers$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(runningTimers => {
      this.handleStoreTimerUpdates(runningTimers);
    });
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.keyboardHandler);
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    
    // Load user preferences
    const preferences = this.storageService.preferences();
    if (preferences.fullScreenMode) {
      this.enterFullscreen();
    }

    // Check if there's an existing timer
    if (this.timerState().timeRemaining > 0) {
      this.showSetup.set(false);
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keyboardHandler);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    this.exitFullscreen();
  }

  /**
   * Handle timer updates from the store (for cancellation logic)
   */
  private handleStoreTimerUpdates(runningTimers: any[]): void {
    const currentRoute = this.router.url;
    
    // Check if there's a running timer from a different route
    const hasActiveTimerFromDifferentRoute = runningTimers.some(timer =>
      timer.route !== currentRoute && timer.isRunning && timer.type !== 'countdown'
    );

    if (hasActiveTimerFromDifferentRoute && this.isRunning()) {
      // Another timer type is running, show notification and stop current timer
      this.snackBar.open('⚠️ Timer cancelled - another timer is active', 'Dismiss', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      this.timerService.stopCountdown();
    }
  }

  // Timer control methods
  onTimerAction(event: { action: string }): void {
    switch (event.action) {
      case 'start':
        this.startTimer();
        break;
      case 'stop':
        this.stopTimer();
        break;
      case 'reset':
        this.resetTimer();
        break;
    }
  }

  private startTimer(): void {
    this.timerService.startCountdown();
    this.audioService.playSuccess();
    this.showSetup.set(false);
    this.timerService.saveTimerStates();
  }

  private stopTimer(): void {
    this.timerService.stopCountdown();
    this.audioService.playButtonClick();
    this.saveToHistory();
    this.timerService.saveTimerStates();
  }

  resetTimer(): void {
    if (this.storageService.preferences().confirmReset) {
      const confirm = window.confirm('Are you sure you want to reset the timer?');
      if (!confirm) return;
    }

    this.timerService.resetCountdown();
    this.audioService.playButtonClick();
    this.showSetup.set(true);
    this.timerService.saveTimerStates();
  }

  // Setup methods
  startCustomTimer(): void {
    const totalMs = (this.customMinutes() * 60 + this.customSeconds()) * 1000;
    if (totalMs <= 0) {
      this.snackBar.open('Please enter a valid time', 'Close', { duration: 3000 });
      return;
    }

    this.timerService.setCountdownTime(totalMs);
    this.selectedPreset.set(null);
    this.startTimer();
  }

  selectPreset(preset: CountdownPreset): void {
    this.selectedPreset.set(preset);
    this.customMinutes.set(preset.minutes);
    this.customSeconds.set(0);
    
    const totalMs = preset.minutes * 60 * 1000;
    this.timerService.setCountdownTime(totalMs);
    this.startTimer();
  }

  quickStart(minutes: number): void {
    const totalMs = minutes * 60 * 1000;
    this.timerService.setCountdownTime(totalMs);
    this.selectedPreset.set(null);
    this.startTimer();
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
      document.documentElement.requestFullscreen();
    }
  }

  private exitFullscreen(): void {
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen();
    }
  }

  // Alert and notification methods
  private onTimerFinished(): void {
    this.audioService.playTimerComplete();
    this.saveToHistory();
    
    // Show completion notification
    this.snackBar.open('⏰ Timer finished!', 'Start New Timer', {
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.resetTimer();
    });

    // Browser notification (if permission granted)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Finished!', {
        body: 'Your countdown timer has completed.',
        icon: '/favicon.ico'
      });
    }

    // Vibration (on supported devices)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }

  private showCriticalNotification(): void {
    // Visual alert (handled by CSS classes)
    // Audio alert for last 10 seconds
    this.audioService.playWarning();
  }

  private showUrgentNotification(): void {
    // Show snack bar for last minute warning
    this.snackBar.open('⚠️ Less than 1 minute remaining!', 'Dismiss', {
      duration: 3000,
      panelClass: ['warning-snackbar']
    });
  }

  // Utility methods
  formatTime(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getTimeStatus(): 'running' | 'paused' | 'stopped' | 'expired' {
    if (this.isFinished()) return 'expired';
    if (!this.isRunning()) return 'stopped';
    return 'running';
  }

  // Keyboard shortcuts
  private onKeyDown(event: KeyboardEvent): void {
    // Don't handle shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case ' ':
        event.preventDefault();
        if (this.showSetup()) {
          this.startCustomTimer();
        } else {
          this.onTimerAction({ action: this.isRunning() ? 'stop' : 'start' });
        }
        break;
      case 'r':
        event.preventDefault();
        this.onTimerAction({ action: 'reset' });
        break;
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
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        const minutes = parseInt(event.key) * 5; // 5, 10, 15, 20, 25 minutes
        if (this.showSetup()) {
          event.preventDefault();
          this.quickStart(minutes);
        }
        break;
    }
  }

  private handleFullscreenChange = (): void => {
    this.isFullscreen = typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  };

  // Storage methods
  private saveToHistory(): void {
    const state = this.timerState();
    const completed = state.timeRemaining === 0;
    const duration = state.initialTime - state.timeRemaining;
    
    if (duration > 0) {
      this.storageService.addHistoryEntry({
        type: 'countdown',
        duration: duration,
        completed: completed
      });
    }
  }

  // Add to favorites
  addCurrentToFavorites(): void {
    const currentTime = this.timerState().initialTime;
    if (currentTime > 0) {
      this.storageService.addFavoritePreset(currentTime);
      this.snackBar.open('Added to favorite presets!', 'Close', { duration: 3000 });
    }
  }

  // Navigation
  goHome(): void {
    this.router.navigate(['/']);
  }

  trackByPreset(index: number, preset: CountdownPreset): string {
    return preset.name;
  }
}