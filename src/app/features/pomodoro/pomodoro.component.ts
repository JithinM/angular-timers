import { Component, signal, computed, effect, OnDestroy, inject, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

import { TimerService, PomodoroState } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { StorageService } from '../../core/services/storage.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';
import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { ControlButtonsComponent } from '../../shared/components/control-buttons/control-buttons.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

interface PomodoroPreset {
  name: string;
  description: string;
  workTime: number; // in minutes
  shortBreak: number; // in minutes
  longBreak: number; // in minutes
  sessions: number;
  icon: string;
}

@Component({
  selector: 'app-pomodoro',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    FormsModule,
    TimeDisplayComponent,
    ControlButtonsComponent,
    AdSlotComponent
  ],
  templateUrl: './pomodoro.component.html',
  styleUrl: './pomodoro.component.scss'
})
export class PomodoroComponent implements OnDestroy {
  private readonly timerService = inject(TimerService);
  private readonly audioService = inject(AudioService);
  private readonly storageService = inject(StorageService);
  private readonly backgroundTimerService = inject(BackgroundTimerService);

  // Signals for reactive state management
  readonly pomodoroState = this.timerService.pomodoroState;
  readonly pomodoroStatus = this.timerService.pomodoroStatus;
  readonly formattedTime = this.timerService.formattedPomodoroTime;
  
  // UI state signals
  readonly isSetupMode = signal(true);
  readonly isFullscreen = signal(false);
  readonly selectedPreset = signal<PomodoroPreset | null>(null);

  // Custom setup form signals
  readonly customWorkTime = signal(25);
  readonly customShortBreak = signal(5);
  readonly customLongBreak = signal(15);
  readonly customSessions = signal(4);

  // Computed signals
  readonly currentPhaseProgress = computed(() => {
    const state = this.pomodoroState();
    if (state.currentSessionType === 'work') {
      return ((state.workTime - state.timeRemaining) / state.workTime) * 100;
    } else if (state.currentSessionType === 'shortBreak') {
      return ((state.shortBreakTime - state.timeRemaining) / state.shortBreakTime) * 100;
    } else {
      return ((state.longBreakTime - state.timeRemaining) / state.longBreakTime) * 100;
    }
  });

  readonly overallProgress = computed(() => {
    const state = this.pomodoroState();
    const totalSessions = state.sessionsUntilLongBreak * 2; // work + break sessions
    const completedFullSessions = Math.floor(state.currentSession / 2) * 2;
    const currentSessionProgress = state.currentSessionType === 'work' ? 
      (state.currentSession - 1) + this.currentPhaseProgress() / 100 :
      state.currentSession + this.currentPhaseProgress() / 100;
    
    return Math.min((currentSessionProgress / totalSessions) * 100, 100);
  });

  readonly sessionTypeIcon = computed(() => {
    const sessionType = this.pomodoroState().currentSessionType;
    switch (sessionType) {
      case 'work': return 'work';
      case 'shortBreak': return 'coffee';
      case 'longBreak': return 'restaurant';
      default: return 'timer';
    }
  });

  readonly sessionTypeName = computed(() => {
    const sessionType = this.pomodoroState().currentSessionType;
    switch (sessionType) {
      case 'work': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Session';
    }
  });

  // Pomodoro presets
  readonly presets: PomodoroPreset[] = [
    {
      name: 'Classic Pomodoro',
      description: 'Traditional 25-5-15 minute intervals',
      workTime: 25,
      shortBreak: 5,
      longBreak: 15,
      sessions: 4,
      icon: 'schedule'
    },
    {
      name: 'Extended Focus',
      description: 'Longer focus sessions for deep work',
      workTime: 45,
      shortBreak: 10,
      longBreak: 30,
      sessions: 3,
      icon: 'psychology'
    },
    {
      name: 'Quick Sprints',
      description: 'Short bursts for high-energy tasks',
      workTime: 15,
      shortBreak: 3,
      longBreak: 10,
      sessions: 6,
      icon: 'flash_on'
    },
    {
      name: 'Study Sessions',
      description: 'Balanced intervals for learning',
      workTime: 30,
      shortBreak: 5,
      longBreak: 20,
      sessions: 4,
      icon: 'school'
    },
    {
      name: 'Creative Flow',
      description: 'Longer breaks for creative thinking',
      workTime: 25,
      shortBreak: 10,
      longBreak: 25,
      sessions: 3,
      icon: 'palette'
    }
  ];

  private keyboardListener?: (event: KeyboardEvent) => void;
  private previousSessionType: 'work' | 'shortBreak' | 'longBreak' = 'work';

  constructor() {
    // Load saved settings
    this.loadSettings();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Effect to handle session changes for audio feedback
    effect(() => {
      const state = this.pomodoroState();
      if (state.currentSessionType !== this.previousSessionType) {
        if (!this.isSetupMode()) {
          this.audioService.playSuccess();
        }
        this.previousSessionType = state.currentSessionType;
      }

      // Play completion sound
      if (state.isCompleted) {
        this.audioService.playPattern('completion');
      }
    });

    // Auto-save settings effect
    effect(() => {
      const settings = {
        workTime: this.customWorkTime(),
        shortBreak: this.customShortBreak(),
        longBreak: this.customLongBreak(),
        sessions: this.customSessions()
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
      }
    });
  }

  ngOnDestroy(): void {
    if (this.keyboardListener && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keyboardListener);
    }
  }

  // Preset selection methods
  selectPreset(preset: PomodoroPreset): void {
    this.selectedPreset.set(preset);
    this.setupPomodoro(
      preset.workTime * 60 * 1000,
      preset.shortBreak * 60 * 1000,
      preset.longBreak * 60 * 1000,
      preset.sessions
    );
    this.startPomodoro();
  }

  // Custom setup methods
  startCustomPomodoro(): void {
    this.selectedPreset.set(null);
    this.setupPomodoro(
      this.customWorkTime() * 60 * 1000,
      this.customShortBreak() * 60 * 1000,
      this.customLongBreak() * 60 * 1000,
      this.customSessions()
    );
    this.startPomodoro();
  }

  private setupPomodoro(workTime: number, shortBreak: number, longBreak: number, sessions: number): void {
    this.timerService.setupPomodoro(workTime, shortBreak, longBreak, sessions);
    this.isSetupMode.set(false);
  }

  private startPomodoro(): void {
    this.timerService.startPomodoroTimer();
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
  }

  // Timer control methods
  toggleTimer(): void {
    const status = this.pomodoroStatus();
    if (status === 'running') {
      this.timerService.stopPomodoroTimer();
    } else {
      this.timerService.startPomodoroTimer();
    }
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
  }

  resetTimer(): void {
    this.timerService.resetPomodoroTimer();
    this.isSetupMode.set(true);
    this.selectedPreset.set(null);
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
  }

  skipSession(): void {
    this.timerService.skipPomodoroSession();
  }

  // Fullscreen methods
  toggleFullscreen(): void {
    if (typeof document === 'undefined') return;

    if (!this.isFullscreen()) {
      document.documentElement.requestFullscreen?.();
      this.isFullscreen.set(true);
    } else {
      document.exitFullscreen?.();
      this.isFullscreen.set(false);
    }
  }

  exitFullscreen(): void {
    if (typeof document === 'undefined') return;
    
    if (this.isFullscreen()) {
      document.exitFullscreen?.();
      this.isFullscreen.set(false);
    }
  }

  // Settings methods
  private loadSettings(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('pomodoroSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.customWorkTime.set(settings.workTime || 25);
        this.customShortBreak.set(settings.shortBreak || 5);
        this.customLongBreak.set(settings.longBreak || 15);
        this.customSessions.set(settings.sessions || 4);
      }
    } catch (error) {
      console.warn('Error loading Pomodoro settings:', error);
    }
  }

  // Keyboard shortcuts
  private setupKeyboardShortcuts(): void {
    if (typeof document === 'undefined') return;

    this.keyboardListener = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (!this.isSetupMode()) {
            this.toggleTimer();
          }
          break;
        case 'KeyR':
          event.preventDefault();
          this.resetTimer();
          break;
        case 'KeyS':
          event.preventDefault();
          if (!this.isSetupMode()) {
            this.skipSession();
          }
          break;
        case 'KeyF':
          event.preventDefault();
          this.toggleFullscreen();
          break;
        case 'Escape':
          event.preventDefault();
          this.exitFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', this.keyboardListener);
  }

  // Utility methods
  formatSessionHistory(): Array<{
    session: number;
    type: string;
    duration: string;
    completedAt: string;
  }> {
    const history = this.pomodoroState().sessionHistory;
    return history.map((session, index) => ({
      session: index + 1,
      type: session.type === 'work' ? 'Focus' : 
            session.type === 'shortBreak' ? 'Short Break' : 'Long Break',
      duration: this.formatDuration(session.duration),
      completedAt: session.completedAt.toLocaleTimeString()
    }));
  }

  private formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  getTotalTime(): string {
    const state = this.pomodoroState();
    const totalMs = state.totalWorkTime + state.totalBreakTime;
    return this.formatDuration(totalMs);
  }

  getProductivityScore(): number {
    const state = this.pomodoroState();
    if (state.completedSessions === 0) return 0;
    
    const targetSessions = state.sessionsUntilLongBreak;
    return Math.min((state.completedSessions / targetSessions) * 100, 100);
  }
}