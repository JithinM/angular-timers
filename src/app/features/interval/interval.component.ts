import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { TimerService } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { StorageService } from '../../core/services/storage.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';

// Shared components
import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { ControlButtonsComponent } from '../../shared/components/control-buttons/control-buttons.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

interface IntervalPreset {
  name: string;
  workMinutes: number;
  restMinutes: number;
  cycles: number;
  description: string;
}

@Component({
  selector: 'app-interval',
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
    MatCardModule,
    MatDividerModule,
    TimeDisplayComponent,
    ControlButtonsComponent,
    AdSlotComponent
  ],
  templateUrl: './interval.component.html',
  styleUrls: ['./interval.component.scss']
})
export class IntervalComponent implements OnInit, OnDestroy {
  private readonly timerService = inject(TimerService);
  private readonly audioService = inject(AudioService);
  private readonly storageService = inject(StorageService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly backgroundTimerService = inject(BackgroundTimerService);

  // Component state
  isFullscreen = false;
  showSetup = signal(true);
  
  // Setup form values
  workMinutes = signal(1);
  workSeconds = signal(0);
  restMinutes = signal(0);
  restSeconds = signal(30);
  totalCycles = signal(5);
  selectedPreset = signal<IntervalPreset | null>(null);

  // Computed values
  intervalState = this.timerService.intervalState;
  
  currentPhaseProgress = computed(() => {
    const state = this.intervalState();
    if (state.isCompleted) return 100;
    
    const totalPhaseTime = state.isWorkPhase ? state.workTime : state.restTime;
    const elapsed = totalPhaseTime - state.timeRemaining;
    return totalPhaseTime > 0 ? (elapsed / totalPhaseTime) * 100 : 0;
  });

  totalProgress = computed(() => {
    const state = this.intervalState();
    if (state.totalCycles === 0) return 0;
    
    const completedCycles = state.currentCycle - 1;
    const currentCycleProgress = state.isWorkPhase ? 0.5 : 1;
    const phaseProgress = this.currentPhaseProgress() / 100;
    
    if (state.isWorkPhase) {
      return ((completedCycles + (phaseProgress * 0.5)) / state.totalCycles) * 100;
    } else {
      return ((completedCycles + 0.5 + (phaseProgress * 0.5)) / state.totalCycles) * 100;
    }
  });

  isRunning = computed(() => this.intervalState().isRunning);
  isCompleted = computed(() => this.intervalState().isCompleted);

  // Interval presets
  intervalPresets: IntervalPreset[] = [
    { name: 'HIIT Beginner', workMinutes: 0.5, restMinutes: 1, cycles: 8, description: '30s work, 1min rest' },
    { name: 'HIIT Standard', workMinutes: 1, restMinutes: 1, cycles: 10, description: '1min work, 1min rest' },
    { name: 'HIIT Advanced', workMinutes: 2, restMinutes: 1, cycles: 8, description: '2min work, 1min rest' },
    { name: 'Tabata', workMinutes: 0.33, restMinutes: 0.17, cycles: 8, description: '20s work, 10s rest' },
    { name: 'Boxing Rounds', workMinutes: 3, restMinutes: 1, cycles: 5, description: '3min work, 1min rest' },
    { name: 'Strength Circuit', workMinutes: 1, restMinutes: 2, cycles: 6, description: '1min work, 2min rest' },
    { name: 'Cardio Blast', workMinutes: 0.75, restMinutes: 0.5, cycles: 12, description: '45s work, 30s rest' }
  ];

  // Keyboard shortcuts
  private keyboardHandler = this.onKeyDown.bind(this);

  constructor() {
    // Effects for phase changes and completion
    effect(() => {
      const state = this.intervalState();
      const prevState = this.getPreviousState();
      
      if (prevState && state.isWorkPhase !== prevState.isWorkPhase) {
        this.onPhaseChange(state.isWorkPhase);
      }
      
      if (state.isCompleted && !prevState?.isCompleted) {
        this.onIntervalCompleted();
      }
    });
  }

  private previousState: any = null;
  private getPreviousState() {
    const current = this.previousState;
    this.previousState = { ...this.intervalState() };
    return current;
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.keyboardHandler);
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    
    // Initialize previous state
    this.previousState = { ...this.intervalState() };
    
    // Load user preferences
    const preferences = this.storageService.preferences();
    if (preferences.fullScreenMode) {
      this.enterFullscreen();
    }

    // Check if there's an existing interval timer
    if (this.intervalState().totalCycles > 0) {
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

  // Timer control methods
  onTimerAction(event: { action: string }): void {
    switch (event.action) {
      case 'start':
        this.startInterval();
        break;
      case 'stop':
        this.stopInterval();
        break;
      case 'reset':
        this.resetInterval();
        break;
    }
  }

  private startInterval(): void {
    this.timerService.startIntervalTimer();
    this.audioService.playSuccess();
    this.showSetup.set(false);
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
  }

  private stopInterval(): void {
    this.timerService.stopIntervalTimer();
    this.audioService.playButtonClick();
    this.saveToHistory();
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
  }

  private resetInterval(): void {
    if (this.storageService.preferences().confirmReset) {
      const confirm = window.confirm('Are you sure you want to reset the interval timer?');
      if (!confirm) return;
    }

    this.timerService.resetIntervalTimer();
    this.audioService.playButtonClick();
    this.showSetup.set(true);
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
  }

  // Setup methods
  setupCustomInterval(): void {
    const workTimeMs = (this.workMinutes() * 60 + this.workSeconds()) * 1000;
    const restTimeMs = (this.restMinutes() * 60 + this.restSeconds()) * 1000;
    const cycles = this.totalCycles();

    if (workTimeMs <= 0 || cycles <= 0) {
      this.snackBar.open('Please enter valid work time and cycles', 'Close', { duration: 3000 });
      return;
    }

    this.timerService.setupInterval(workTimeMs, restTimeMs, cycles);
    this.selectedPreset.set(null);
    this.startInterval();
  }

  selectPreset(preset: IntervalPreset): void {
    this.selectedPreset.set(preset);
    
    const workTimeMs = preset.workMinutes * 60 * 1000;
    const restTimeMs = preset.restMinutes * 60 * 1000;
    
    this.workMinutes.set(Math.floor(preset.workMinutes));
    this.workSeconds.set(Math.round((preset.workMinutes % 1) * 60));
    this.restMinutes.set(Math.floor(preset.restMinutes));
    this.restSeconds.set(Math.round((preset.restMinutes % 1) * 60));
    this.totalCycles.set(preset.cycles);
    
    this.timerService.setupInterval(workTimeMs, restTimeMs, preset.cycles);
    this.startInterval();
  }

  skipPhase(): void {
    this.timerService.skipIntervalPhase();
    this.audioService.playButtonClick();
  }

  // Phase change handlers
  private onPhaseChange(isWorkPhase: boolean): void {
    if (isWorkPhase) {
      this.audioService.playSuccess(); // Work phase start
      this.snackBar.open('💪 Work Phase Started!', '', { duration: 2000 });
    } else {
      this.audioService.playTimerComplete(); // Rest phase start
      this.snackBar.open('😌 Rest Phase Started', '', { duration: 2000 });
    }
  }

  private onIntervalCompleted(): void {
    this.audioService.playPattern('completion');
    this.saveToHistory();
    
    // Show completion notification
    this.snackBar.open('🎉 Interval Training Complete!', 'Start New Session', {
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.resetInterval();
    });

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Interval Training Complete!', {
        body: 'Great job completing your workout session!',
        icon: '/favicon.ico'
      });
    }

    // Vibration
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
    }
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

  // Utility methods
  roundProgress(progress: number): number {
    return Math.round(progress);
  }

  formatTime(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getPhaseStatus(): 'running' | 'paused' | 'stopped' | 'expired' {
    const state = this.intervalState();
    if (state.isCompleted) return 'expired';
    if (state.isRunning) return 'running';
    return 'stopped';
  }

  getCurrentPhaseType(): string {
    return this.intervalState().isWorkPhase ? 'Work' : 'Rest';
  }

  getPhaseIcon(): string {
    return this.intervalState().isWorkPhase ? 'fitness_center' : 'self_improvement';
  }

  getPhaseColor(): string {
    return this.intervalState().isWorkPhase ? 'warn' : 'primary';
  }

  getTotalWorkoutTime(): string {
    const state = this.intervalState();
    const totalTime = (state.workTime + state.restTime) * state.totalCycles;
    return this.formatTime(totalTime);
  }

  // Keyboard shortcuts
  private onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case ' ':
        event.preventDefault();
        if (this.showSetup()) {
          this.setupCustomInterval();
        } else {
          this.onTimerAction({ action: this.isRunning() ? 'stop' : 'start' });
        }
        break;
      case 'r':
        event.preventDefault();
        this.onTimerAction({ action: 'reset' });
        break;
      case 's':
        if (!this.showSetup()) {
          event.preventDefault();
          this.skipPhase();
        }
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
    }
  }

  private handleFullscreenChange = (): void => {
    this.isFullscreen = typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  };

  // Storage methods
  private saveToHistory(): void {
    const state = this.intervalState();
    const totalDuration = state.totalWorkTime + state.totalRestTime;
    
    if (totalDuration > 0) {
      this.storageService.addHistoryEntry({
        type: 'interval',
        duration: totalDuration,
        completed: state.isCompleted
      });
    }
  }

  // Navigation
  goHome(): void {
    this.router.navigate(['/']);
  }

  trackByPreset(index: number, preset: IntervalPreset): string {
    return preset.name;
  }
}