import { Injectable, signal, computed, effect, inject, untracked } from '@angular/core';
import { NotificationsService } from './notifications.service';
import { BackgroundTimerService } from './background-timer.service';
import { BackgroundSyncService } from './background-sync.service';
import { TimerApiService } from './timer-api.service';

export interface TimerState {
  timeElapsed: number;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedTime: number;
  laps: number[];
}

export interface CountdownState {
  initialTime: number;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  isExpired: boolean;
}

export interface IntervalState {
  workTime: number;
  restTime: number;
  totalCycles: number;
  currentCycle: number;
  isWorkPhase: boolean;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  totalWorkTime: number;
  totalRestTime: number;
}

export interface PomodoroState {
  workTime: number; // Default 25 minutes
  shortBreakTime: number; // Default 5 minutes
  longBreakTime: number; // Default 15 minutes
  sessionsUntilLongBreak: number; // Default 4
  currentSession: number;
  currentSessionType: 'work' | 'shortBreak' | 'longBreak';
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  completedSessions: number;
  totalWorkTime: number;
  totalBreakTime: number;
  sessionHistory: {
    type: 'work' | 'shortBreak' | 'longBreak';
    duration: number;
    completedAt: Date;
  }[];
}

export interface EggTimerState {
  initialTime: number;
  timeRemaining: number;
  isRunning: boolean;
  isCompleted: boolean;
  selectedPreset: string | null;
}

export interface BombTimerState {
  initialTime: number;
  timeRemaining: number;
  isRunning: boolean;
  isExploded: boolean;
  isDefused: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MeditationTimerState {
  breatheInDuration: number;
  breatheOutDuration: number;
  totalCycles: number;
  currentPhase: 'in' | 'out' | 'hold';
  currentCycle: number;
  timeRemaining: number;
  isRunning: boolean;
  isCompleted: boolean;
  enableSound: boolean;
}

export interface BasketballTimerState {
  periodDuration: number;
  timeRemaining: number;
  isRunning: boolean;
  currentPeriod: number;
  totalPeriods: number;
  homeScore: number;
  awayScore: number;
}

export interface HockeyTimerState {
  periodDuration: number;
  timeRemaining: number;
  isRunning: boolean;
  currentPeriod: number;
  totalPeriods: number;
  homePenalties: number;
  awayPenalties: number;
}

export interface PresentationSegment {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

export interface PresentationTimerState {
  segments: PresentationSegment[];
  currentSegmentIndex: number;
  timeRemaining: number;
  isRunning: boolean;
  isPresentationComplete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private readonly notificationsService = inject(NotificationsService);
  private readonly backgroundTimerService = inject(BackgroundTimerService);
  private readonly backgroundSyncService = inject(BackgroundSyncService);
  private readonly timerApiService = inject(TimerApiService);

  // Stopwatch signals
  private readonly _stopwatchState = signal<TimerState>({
    timeElapsed: 0,
    isRunning: false,
    isPaused: false,
    startTime: null,
    pausedTime: 0,
    laps: []
  });

  // Countdown signals
  private readonly _countdownState = signal<CountdownState>({
    initialTime: 0,
    timeRemaining: 0,
    isRunning: false,
    isPaused: false,
    isExpired: false
  });

  // Interval timer signals
  private readonly _intervalState = signal<IntervalState>({
    workTime: 0,
    restTime: 0,
    totalCycles: 0,
    currentCycle: 0,
    isWorkPhase: true,
    timeRemaining: 0,
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    totalWorkTime: 0,
    totalRestTime: 0
  });

  // Pomodoro timer signals
  private readonly _pomodoroState = signal<PomodoroState>({
    workTime: 25 * 60 * 1000, // 25 minutes
    shortBreakTime: 5 * 60 * 1000, // 5 minutes
    longBreakTime: 15 * 60 * 1000, // 15 minutes
    sessionsUntilLongBreak: 4,
    currentSession: 1,
    currentSessionType: 'work',
    timeRemaining: 25 * 60 * 1000,
    isRunning: false,
    isPaused: false,
    isCompleted: false,
    completedSessions: 0,
    totalWorkTime: 0,
    totalBreakTime: 0,
    sessionHistory: []
  });

  // Egg timer signals
  private readonly _eggTimerState = signal<EggTimerState>({
    initialTime: 0,
    timeRemaining: 0,
    isRunning: false,
    isCompleted: false,
    selectedPreset: null
  });

  // Bomb timer signals
  private readonly _bombTimerState = signal<BombTimerState>({
    initialTime: 30000, // 30 seconds default
    timeRemaining: 30000,
    isRunning: false,
    isExploded: false,
    isDefused: false,
    difficulty: 'medium'
  });

  // Meditation timer signals
  private readonly _meditationTimerState = signal<MeditationTimerState>({
    breatheInDuration: 4,
    breatheOutDuration: 6,
    totalCycles: 10,
    currentPhase: 'in',
    currentCycle: 1,
    timeRemaining: 0,
    isRunning: false,
    isCompleted: false,
    enableSound: true
  });

  // Basketball timer signals
  private readonly _basketballTimerState = signal<BasketballTimerState>({
    periodDuration: 12 * 60 * 1000, // 12 minutes default
    timeRemaining: 12 * 60 * 1000,
    isRunning: false,
    currentPeriod: 1,
    totalPeriods: 4,
    homeScore: 0,
    awayScore: 0
  });

  // Hockey timer signals
  private readonly _hockeyTimerState = signal<HockeyTimerState>({
    periodDuration: 15 * 60 * 1000, // 15 minutes default
    timeRemaining: 15 * 60 * 1000,
    isRunning: false,
    currentPeriod: 1,
    totalPeriods: 3,
    homePenalties: 0,
    awayPenalties: 0
  });

  // Presentation timer signals
  private readonly _presentationTimerState = signal<PresentationTimerState>({
    segments: [],
    currentSegmentIndex: 0,
    timeRemaining: 0,
    isRunning: false,
    isPresentationComplete: false
  });

  // Interval reference for timer updates
  private intervalId: number | null = null;

  // Public readonly signals
  readonly stopwatchState = this._stopwatchState.asReadonly();
  readonly countdownState = this._countdownState.asReadonly();
  readonly intervalState = this._intervalState.asReadonly();
  readonly pomodoroState = this._pomodoroState.asReadonly();
  readonly eggTimerState = this._eggTimerState.asReadonly();
  readonly bombTimerState = this._bombTimerState.asReadonly();
  readonly meditationTimerState = this._meditationTimerState.asReadonly();
  readonly basketballTimerState = this._basketballTimerState.asReadonly();
  readonly hockeyTimerState = this._hockeyTimerState.asReadonly();
  readonly presentationTimerState = this._presentationTimerState.asReadonly();

  // Computed signals for formatted time displays
  readonly formattedStopwatchTime = computed(() => 
    this.formatTime(this._stopwatchState().timeElapsed)
  );

  readonly formattedCountdownTime = computed(() => 
    this.formatTime(this._countdownState().timeRemaining)
  );

  readonly stopwatchStatus = computed(() => {
    const state = this._stopwatchState();
    if (state.isRunning) return 'running';
    if (state.isPaused) return 'paused';
    return 'stopped';
  });

  readonly countdownStatus = computed(() => {
    const state = this._countdownState();
    if (state.isExpired) return 'expired';
    if (state.isRunning) return 'running';
    if (state.isPaused) return 'paused';
    return 'stopped';
  });

  readonly intervalStatus = computed(() => {
    const state = this._intervalState();
    if (state.isCompleted) return 'completed';
    if (state.isRunning) return 'running';
    if (state.isPaused) return 'paused';
    return 'stopped';
  });

  readonly formattedIntervalTime = computed(() =>
    this.formatTime(this._intervalState().timeRemaining)
  );

  readonly pomodoroStatus = computed(() => {
    const state = this._pomodoroState();
    if (state.isCompleted) return 'completed';
    if (state.isRunning) return 'running';
    if (state.isPaused) return 'paused';
    return 'stopped';
  });

  readonly formattedPomodoroTime = computed(() =>
    this.formatTime(this._pomodoroState().timeRemaining)
  );

  constructor() {
    // Effect to handle timer updates
    effect(() => {
      const stopwatch = this._stopwatchState();
      const countdown = this._countdownState();
      const interval = this._intervalState();
      const pomodoro = this._pomodoroState();
      const eggTimer = this._eggTimerState();
      const bombTimer = this._bombTimerState();
      const meditationTimer = this._meditationTimerState();
      const basketballTimer = this._basketballTimerState();
      const hockeyTimer = this._hockeyTimerState();
      const presentationTimer = this._presentationTimerState();
      
      // Use untracked to prevent change detection issues during SSR
      untracked(() => {
        if (stopwatch.isRunning || countdown.isRunning || interval.isRunning || pomodoro.isRunning ||
            eggTimer.isRunning || bombTimer.isRunning || meditationTimer.isRunning ||
            basketballTimer.isRunning || hockeyTimer.isRunning || presentationTimer.isRunning) {
          this.startInterval();
        } else {
          this.stopInterval();
        }
      });
    });

    // Setup visibility change handler to restore timer states when tab becomes visible
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Tab became visible, restore timer states
          this.restoreTimerStates();
        }
      });
    }

    // Restore timer states on service initialization
    if (typeof window !== 'undefined') {
      // Use setTimeout to ensure this runs after the constructor completes
      setTimeout(() => {
        this.restoreTimerStates();
      }, 0);
    }
  }

  // Stopwatch methods
  startStopwatch(): void {
    this._stopwatchState.update(state => ({
      ...state,
      isRunning: true,
      isPaused: false,
      startTime: state.startTime || Date.now() - state.timeElapsed
    }));
    this.saveTimerStates();
  }

  stopStopwatch(): void {
    this._stopwatchState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: true
    }));
    this.saveTimerStates();
  }

  resetStopwatch(): void {
    this._stopwatchState.update(state => ({
      ...state,
      timeElapsed: 0,
      isRunning: false,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
      laps: []
    }));
    this.saveTimerStates();
  }

  addLap(): void {
    const currentTime = this._stopwatchState().timeElapsed;
    this._stopwatchState.update(state => ({
      ...state,
      laps: [...state.laps, currentTime]
    }));
  }

  // Countdown methods
  setCountdownTime(milliseconds: number): void {
    this._countdownState.update(state => ({
      ...state,
      initialTime: milliseconds,
      timeRemaining: milliseconds,
      isExpired: false
    }));
  }

  startCountdown(): void {
    const state = this._countdownState();
    if (state.timeRemaining > 0) {
      this._countdownState.update(current => ({
        ...current,
        isRunning: true,
        isPaused: false
      }));
      this.saveTimerStates();
    }
  }

  stopCountdown(): void {
    this._countdownState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: true
    }));
    this.saveTimerStates();
  }

  resetCountdown(): void {
    const initialTime = this._countdownState().initialTime;
    this._countdownState.update(state => ({
      ...state,
      timeRemaining: initialTime,
      isRunning: false,
      isPaused: false,
      isExpired: false
    }));
    this.saveTimerStates();
  }

  addTimeToCountdown(milliseconds: number): void {
    this._countdownState.update(state => ({
      ...state,
      timeRemaining: Math.max(0, state.timeRemaining + milliseconds),
      isExpired: false
    }));
  }

  // Interval timer methods
  setupInterval(workTimeMs: number, restTimeMs: number, cycles: number): void {
    this._intervalState.update(state => ({
      ...state,
      workTime: workTimeMs,
      restTime: restTimeMs,
      totalCycles: cycles,
      currentCycle: 1,
      isWorkPhase: true,
      timeRemaining: workTimeMs,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      totalWorkTime: 0,
      totalRestTime: 0
    }));
  }

  startIntervalTimer(): void {
    const state = this._intervalState();
    if (state.timeRemaining > 0 && !state.isCompleted) {
      this._intervalState.update(current => ({
        ...current,
        isRunning: true,
        isPaused: false
      }));
      this.saveTimerStates();
    }
  }

  stopIntervalTimer(): void {
    this._intervalState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: true
    }));
    this.saveTimerStates();
  }

  resetIntervalTimer(): void {
    const state = this._intervalState();
    this._intervalState.update(current => ({
      ...current,
      currentCycle: 1,
      isWorkPhase: true,
      timeRemaining: state.workTime,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      totalWorkTime: 0,
      totalRestTime: 0
    }));
    this.saveTimerStates();
  }

  skipIntervalPhase(): void {
    const state = this._intervalState();
    if (state.isWorkPhase) {
      // Switch to rest phase
      this._intervalState.update(current => ({
        ...current,
        isWorkPhase: false,
        timeRemaining: state.restTime,
        totalWorkTime: current.totalWorkTime + (state.workTime - state.timeRemaining)
      }));
    } else {
      // Move to next cycle or complete
      if (state.currentCycle >= state.totalCycles) {
        this._intervalState.update(current => ({
          ...current,
          isCompleted: true,
          isRunning: false,
          timeRemaining: 0,
          totalRestTime: current.totalRestTime + (state.restTime - state.timeRemaining)
        }));
      } else {
        this._intervalState.update(current => ({
          ...current,
          currentCycle: current.currentCycle + 1,
          isWorkPhase: true,
          timeRemaining: state.workTime,
          totalRestTime: current.totalRestTime + (state.restTime - state.timeRemaining)
        }));
      }
    }
  }

  private updateIntervalTimer(): void {
    const state = this._intervalState();
    if (!state.isRunning) return;

    const newRemaining = Math.max(0, state.timeRemaining - 10);
    
    if (newRemaining === 0) {
      // Phase completed
      if (state.isWorkPhase) {
        // Work phase completed, switch to rest
        this._intervalState.update(current => ({
          ...current,
          isWorkPhase: false,
          timeRemaining: state.restTime,
          totalWorkTime: current.totalWorkTime + state.workTime
        }));
        
        // Send notification for work phase completion
        this.notificationsService.sendIntervalCompletion('work', state.currentCycle);
      } else {
        // Rest phase completed
        if (state.currentCycle >= state.totalCycles) {
          // All cycles completed
          this._intervalState.update(current => ({
            ...current,
            isCompleted: true,
            isRunning: false,
            timeRemaining: 0,
            totalRestTime: current.totalRestTime + state.restTime
          }));
          
          // Send notification when interval timer completes
          this.notificationsService.sendTimerCompletion('Interval');
        } else {
          // Move to next cycle
          this._intervalState.update(current => ({
            ...current,
            currentCycle: current.currentCycle + 1,
            isWorkPhase: true,
            timeRemaining: state.workTime,
            totalRestTime: current.totalRestTime + state.restTime
          }));
        }
      }
    } else {
      // Update remaining time
      this._intervalState.update(current => ({
        ...current,
        timeRemaining: newRemaining
      }));
    }
  }

  // Pomodoro timer methods
  setupPomodoro(workTimeMs?: number, shortBreakTimeMs?: number, longBreakTimeMs?: number, sessionsUntilLongBreak?: number): void {
    this._pomodoroState.update(state => ({
      ...state,
      workTime: workTimeMs || 25 * 60 * 1000,
      shortBreakTime: shortBreakTimeMs || 5 * 60 * 1000,
      longBreakTime: longBreakTimeMs || 15 * 60 * 1000,
      sessionsUntilLongBreak: sessionsUntilLongBreak || 4,
      currentSession: 1,
      currentSessionType: 'work',
      timeRemaining: workTimeMs || 25 * 60 * 1000,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      completedSessions: 0,
      totalWorkTime: 0,
      totalBreakTime: 0,
      sessionHistory: []
    }));
  }

  startPomodoroTimer(): void {
    const state = this._pomodoroState();
    if (state.timeRemaining > 0 && !state.isCompleted) {
      this._pomodoroState.update(current => ({
        ...current,
        isRunning: true,
        isPaused: false
      }));
      this.saveTimerStates();
    }
  }

  stopPomodoroTimer(): void {
    this._pomodoroState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: true
    }));
    this.saveTimerStates();
  }

  resetPomodoroTimer(): void {
    const state = this._pomodoroState();
    this._pomodoroState.update(current => ({
      ...current,
      currentSession: 1,
      currentSessionType: 'work',
      timeRemaining: state.workTime,
      isRunning: false,
      isPaused: false,
      isCompleted: false,
      completedSessions: 0,
      totalWorkTime: 0,
      totalBreakTime: 0,
      sessionHistory: []
    }));
    this.saveTimerStates();
  }

  skipPomodoroSession(): void {
    const state = this._pomodoroState();
    
    if (state.currentSessionType === 'work') {
      // Complete work session and move to break
      const nextBreakType = state.currentSession % state.sessionsUntilLongBreak === 0 ? 'longBreak' : 'shortBreak';
      const nextBreakTime = nextBreakType === 'longBreak' ? state.longBreakTime : state.shortBreakTime;
      
      this._pomodoroState.update(current => ({
        ...current,
        currentSessionType: nextBreakType,
        timeRemaining: nextBreakTime,
        completedSessions: current.completedSessions + 1,
        totalWorkTime: current.totalWorkTime + (state.workTime - state.timeRemaining),
        sessionHistory: [...current.sessionHistory, {
          type: 'work',
          duration: state.workTime - state.timeRemaining,
          completedAt: new Date()
        }]
      }));
    } else {
      // Complete break session and move to next work session or complete
      if (state.currentSession >= 8) { // 4 work sessions + 4 breaks = 8 total
        this._pomodoroState.update(current => ({
          ...current,
          isCompleted: true,
          isRunning: false,
          timeRemaining: 0,
          totalBreakTime: current.totalBreakTime + (
            state.currentSessionType === 'longBreak' ?
            state.longBreakTime - state.timeRemaining :
            state.shortBreakTime - state.timeRemaining
          ),
          sessionHistory: [...current.sessionHistory, {
            type: state.currentSessionType,
            duration: state.currentSessionType === 'longBreak' ?
              state.longBreakTime - state.timeRemaining :
              state.shortBreakTime - state.timeRemaining,
            completedAt: new Date()
          }]
        }));
      } else {
        this._pomodoroState.update(current => ({
          ...current,
          currentSession: current.currentSession + 1,
          currentSessionType: 'work',
          timeRemaining: state.workTime,
          totalBreakTime: current.totalBreakTime + (
            state.currentSessionType === 'longBreak' ?
            state.longBreakTime - state.timeRemaining :
            state.shortBreakTime - state.timeRemaining
          ),
          sessionHistory: [...current.sessionHistory, {
            type: state.currentSessionType,
            duration: state.currentSessionType === 'longBreak' ?
              state.longBreakTime - state.timeRemaining :
              state.shortBreakTime - state.timeRemaining,
            completedAt: new Date()
          }]
        }));
      }
    }
  }

  private updatePomodoroTimer(): void {
    const state = this._pomodoroState();
    if (!state.isRunning) return;

    const newRemaining = Math.max(0, state.timeRemaining - 10);
    
    if (newRemaining === 0) {
      // Session completed
      if (state.currentSessionType === 'work') {
        // Work session completed, move to break
        const nextBreakType = state.currentSession % state.sessionsUntilLongBreak === 0 ? 'longBreak' : 'shortBreak';
        const nextBreakTime = nextBreakType === 'longBreak' ? state.longBreakTime : state.shortBreakTime;
        
        this._pomodoroState.update(current => ({
          ...current,
          currentSessionType: nextBreakType,
          timeRemaining: nextBreakTime,
          completedSessions: current.completedSessions + 1,
          totalWorkTime: current.totalWorkTime + state.workTime,
          sessionHistory: [...current.sessionHistory, {
            type: 'work',
            duration: state.workTime,
            completedAt: new Date()
          }]
        }));
        
        // Send notification for work phase completion
        this.notificationsService.sendPomodoroCompletion('work');
      } else {
        // Break session completed
        if (state.currentSession >= 8) { // Complete after 4 full cycles
          this._pomodoroState.update(current => ({
            ...current,
            isCompleted: true,
            isRunning: false,
            timeRemaining: 0,
            totalBreakTime: current.totalBreakTime + (
              state.currentSessionType === 'longBreak' ? state.longBreakTime : state.shortBreakTime
            ),
            sessionHistory: [...current.sessionHistory, {
              type: state.currentSessionType,
              duration: state.currentSessionType === 'longBreak' ? state.longBreakTime : state.shortBreakTime,
              completedAt: new Date()
            }]
          }));
          
          // Send notification when pomodoro timer completes
          this.notificationsService.sendTimerCompletion('Pomodoro');
        } else {
          // Send notification for break phase completion and moving to work
          this.notificationsService.sendPomodoroCompletion(state.currentSessionType);
          // Move to next work session
          this._pomodoroState.update(current => ({
            ...current,
            currentSession: current.currentSession + 1,
            currentSessionType: 'work',
            timeRemaining: state.workTime,
            totalBreakTime: current.totalBreakTime + (
              state.currentSessionType === 'longBreak' ? state.longBreakTime : state.shortBreakTime
            ),
            sessionHistory: [...current.sessionHistory, {
              type: state.currentSessionType,
              duration: state.currentSessionType === 'longBreak' ? state.longBreakTime : state.shortBreakTime,
              completedAt: new Date()
            }]
          }));
        }
      }
    } else {
      // Update remaining time
      this._pomodoroState.update(current => ({
        ...current,
        timeRemaining: newRemaining
      }));
    }
  }

  // Egg Timer methods
  setEggTimerTime(milliseconds: number, preset?: string): void {
    this._eggTimerState.update(state => ({
      ...state,
      initialTime: milliseconds,
      timeRemaining: milliseconds,
      isCompleted: false,
      selectedPreset: preset || null
    }));
  }

  startEggTimer(): void {
    const state = this._eggTimerState();
    if (state.timeRemaining > 0) {
      this._eggTimerState.update(current => ({
        ...current,
        isRunning: true
      }));
      this.saveTimerStates();
    }
  }

  stopEggTimer(): void {
    this._eggTimerState.update(state => ({
      ...state,
      isRunning: false
    }));
    this.saveTimerStates();
  }

  resetEggTimer(): void {
    const initialTime = this._eggTimerState().initialTime;
    this._eggTimerState.update(state => ({
      ...state,
      timeRemaining: initialTime,
      isRunning: false,
      isCompleted: false
    }));
    this.saveTimerStates();
  }

  clearEggTimerCompletion(): void {
    this._eggTimerState.update(state => ({
      ...state,
      isCompleted: false
    }));
  }

  // Bomb Timer methods
  setBombTimerTime(milliseconds: number, difficulty: 'easy' | 'medium' | 'hard'): void {
    this._bombTimerState.update(state => ({
      ...state,
      initialTime: milliseconds,
      timeRemaining: milliseconds,
      isExploded: false,
      isDefused: false,
      difficulty
    }));
  }

  startBombTimer(): void {
    const state = this._bombTimerState();
    if (state.timeRemaining > 0) {
      this._bombTimerState.update(current => ({
        ...current,
        isRunning: true,
        isExploded: false,
        isDefused: false
      }));
      this.saveTimerStates();
    }
  }

  stopBombTimer(): void {
    this._bombTimerState.update(state => ({
      ...state,
      isRunning: false
    }));
    this.saveTimerStates();
  }

  resetBombTimer(): void {
    const initialTime = this._bombTimerState().initialTime;
    this._bombTimerState.update(state => ({
      ...state,
      timeRemaining: initialTime,
      isRunning: false,
      isExploded: false,
      isDefused: false
    }));
    this.saveTimerStates();
  }

  defuseBomb(): void {
    this._bombTimerState.update(state => ({
      ...state,
      isRunning: false,
      isDefused: true
    }));
    this.saveTimerStates();
  }

  clearBombTimerCompletion(): void {
    this._bombTimerState.update(state => ({
      ...state,
      isExploded: false,
      isDefused: false
    }));
  }

  // Meditation Timer methods
  setupMeditationTimer(breatheInDuration: number, breatheOutDuration: number, totalCycles: number, enableSound: boolean): void {
    this._meditationTimerState.update(state => ({
      ...state,
      breatheInDuration,
      breatheOutDuration,
      totalCycles,
      enableSound,
      currentPhase: 'in',
      currentCycle: 1,
      timeRemaining: breatheInDuration * 1000,
      isRunning: false,
      isCompleted: false
    }));
  }

  startMeditationTimer(): void {
    const state = this._meditationTimerState();
    
    this._meditationTimerState.update(current => ({
      ...current,
      isRunning: true,
      isCompleted: false,
      currentPhase: 'in',
      timeRemaining: state.breatheInDuration * 1000
    }));
    this.saveTimerStates();
  }

  stopMeditationTimer(): void {
    this._meditationTimerState.update(state => ({
      ...state,
      isRunning: false
    }));
    this.saveTimerStates();
  }

  resetMeditationTimer(): void {
    const state = this._meditationTimerState();
    this._meditationTimerState.update(current => ({
      ...current,
      currentPhase: 'in',
      currentCycle: 1,
      timeRemaining: state.breatheInDuration * 1000,
      isRunning: false,
      isCompleted: false
    }));
    this.saveTimerStates();
  }

  clearMeditationTimerCompletion(): void {
    this._meditationTimerState.update(state => ({
      ...state,
      isCompleted: false
    }));
  }

  // Basketball Timer methods
  setupBasketballTimer(periodDuration: number, totalPeriods: number): void {
    this._basketballTimerState.update(state => ({
      ...state,
      periodDuration,
      timeRemaining: periodDuration,
      totalPeriods,
      currentPeriod: 1,
      isRunning: false,
      homeScore: 0,
      awayScore: 0
    }));
  }

  startBasketballTimer(): void {
    const state = this._basketballTimerState();
    if (state.timeRemaining > 0) {
      this._basketballTimerState.update(current => ({
        ...current,
        isRunning: true
      }));
      this.saveTimerStates();
    }
  }

  stopBasketballTimer(): void {
    this._basketballTimerState.update(state => ({
      ...state,
      isRunning: false
    }));
    this.saveTimerStates();
  }

  resetBasketballTimer(): void {
    const periodDuration = this._basketballTimerState().periodDuration;
    this._basketballTimerState.update(state => ({
      ...state,
      timeRemaining: periodDuration,
      isRunning: false
    }));
    this.saveTimerStates();
  }

  updateBasketballScore(team: 'home' | 'away', increment: number): void {
    this._basketballTimerState.update(state => ({
      ...state,
      [team === 'home' ? 'homeScore' : 'awayScore']: Math.max(0, (team === 'home' ? state.homeScore : state.awayScore) + increment)
    }));
  }

  // Hockey Timer methods
  setupHockeyTimer(periodDuration: number, totalPeriods: number): void {
    this._hockeyTimerState.update(state => ({
      ...state,
      periodDuration,
      timeRemaining: periodDuration,
      totalPeriods,
      currentPeriod: 1,
      isRunning: false,
      homePenalties: 0,
      awayPenalties: 0
    }));
  }

  startHockeyTimer(): void {
    const state = this._hockeyTimerState();
    if (state.timeRemaining > 0) {
      this._hockeyTimerState.update(current => ({
        ...current,
        isRunning: true
      }));
      this.saveTimerStates();
    }
  }

  stopHockeyTimer(): void {
    this._hockeyTimerState.update(state => ({
      ...state,
      isRunning: false
    }));
    this.saveTimerStates();
  }

  resetHockeyTimer(): void {
    const periodDuration = this._hockeyTimerState().periodDuration;
    this._hockeyTimerState.update(state => ({
      ...state,
      timeRemaining: periodDuration,
      isRunning: false
    }));
    this.saveTimerStates();
  }

  updateHockeyPenalties(team: 'home' | 'away', increment: number): void {
    this._hockeyTimerState.update(state => ({
      ...state,
      [team === 'home' ? 'homePenalties' : 'awayPenalties']: Math.max(0, (team === 'home' ? state.homePenalties : state.awayPenalties) + increment)
    }));
  }

  // Presentation Timer methods
  setupPresentationTimer(segments: PresentationSegment[]): void {
    this._presentationTimerState.update(state => ({
      ...state,
      segments,
      currentSegmentIndex: 0,
      timeRemaining: segments.length > 0 ? segments[0].duration * 1000 : 0,
      isRunning: false,
      isPresentationComplete: false
    }));
  }

  startPresentationTimer(): void {
    const state = this._presentationTimerState();
    if (state.timeRemaining > 0) {
      this._presentationTimerState.update(current => ({
        ...current,
        isRunning: true
      }));
      this.saveTimerStates();
    }
  }

  stopPresentationTimer(): void {
    this._presentationTimerState.update(state => ({
      ...state,
      isRunning: false
    }));
    this.saveTimerStates();
  }

  resetPresentationTimer(): void {
    const state = this._presentationTimerState();
    const currentSegment = state.segments[state.currentSegmentIndex];
    this._presentationTimerState.update(current => ({
      ...current,
      timeRemaining: currentSegment ? currentSegment.duration * 1000 : 0,
      isRunning: false,
      isPresentationComplete: false
    }));
    this.saveTimerStates();
  }

  nextPresentationSegment(): void {
    const state = this._presentationTimerState();
    if (state.currentSegmentIndex < state.segments.length - 1) {
      const nextIndex = state.currentSegmentIndex + 1;
      const nextSegment = state.segments[nextIndex];
      this._presentationTimerState.update(current => ({
        ...current,
        currentSegmentIndex: nextIndex,
        timeRemaining: nextSegment.duration * 1000,
        segments: current.segments.map((seg, idx) =>
          idx === current.currentSegmentIndex ? { ...seg, completed: true } : seg
        )
      }));
    } else {
      this._presentationTimerState.update(current => ({
        ...current,
        isPresentationComplete: true,
        isRunning: false,
        segments: current.segments.map((seg, idx) =>
          idx === current.currentSegmentIndex ? { ...seg, completed: true } : seg
        )
      }));
    }
  }

  clearPresentationTimerCompletion(): void {
    this._presentationTimerState.update(state => ({
      ...state,
      isPresentationComplete: false
    }));
  }

  /**
   * Clear all completion states to prevent stale notifications
   */
  clearAllCompletionStates(): void {
    this.clearEggTimerCompletion();
    this.clearBombTimerCompletion();
    this.clearMeditationTimerCompletion();
    this.clearPresentationTimerCompletion();
    
    // Clear interval and pomodoro completion states
    this._intervalState.update(state => ({
      ...state,
      isCompleted: false
    }));
    
    this._pomodoroState.update(state => ({
      ...state,
      isCompleted: false
    }));
    
    // Clear countdown expired state
    this._countdownState.update(state => ({
      ...state,
      isExpired: false
    }));
  }

  // Private methods
  private startInterval(): void {
    if (this.intervalId) return;
    
    this.intervalId = window.setInterval(() => {
      this.updateTimers();
    }, 10); // Update every 10ms for smooth display
  }

  private stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateTimers(): void {
    // Update stopwatch
    const stopwatchState = this._stopwatchState();
    if (stopwatchState.isRunning && stopwatchState.startTime) {
      const newElapsed = Date.now() - stopwatchState.startTime;
      this._stopwatchState.update(state => ({
        ...state,
        timeElapsed: newElapsed
      }));
    }

    // Update countdown
    const countdownState = this._countdownState();
    if (countdownState.isRunning) {
      const newRemaining = Math.max(0, countdownState.timeRemaining - 10);
      
      this._countdownState.update(state => ({
        ...state,
        timeRemaining: newRemaining,
        isExpired: newRemaining === 0,
        isRunning: newRemaining > 0
      }));
      
      // Send notification when countdown expires
      if (newRemaining === 0) {
        this.notificationsService.sendTimerCompletion('Countdown');
      }
    }

    // Update interval timer
    this.updateIntervalTimer();

    // Update pomodoro timer
    this.updatePomodoroTimer();

    // Update egg timer
    this.updateEggTimer();

    // Update bomb timer
    this.updateBombTimer();

    // Update meditation timer
    this.updateMeditationTimer();

    // Update basketball timer
    this.updateBasketballTimer();

    // Update hockey timer
    this.updateHockeyTimer();

    // Update presentation timer
    this.updatePresentationTimer();
  }

  private updateEggTimer(): void {
    const state = this._eggTimerState();
    if (!state.isRunning) return;

    const newRemaining = Math.max(0, state.timeRemaining - 10);
    
    if (newRemaining === 0) {
      this._eggTimerState.update(current => ({
        ...current,
        timeRemaining: 0,
        isRunning: false,
        isCompleted: true
      }));
      this.notificationsService.sendTimerCompletion('Egg Timer');
    } else {
      this._eggTimerState.update(current => ({
        ...current,
        timeRemaining: newRemaining
      }));
    }
  }

  private updateBombTimer(): void {
    const state = this._bombTimerState();
    if (!state.isRunning) return;

    const newRemaining = Math.max(0, state.timeRemaining - 10);
    
    if (newRemaining === 0) {
      this._bombTimerState.update(current => ({
        ...current,
        timeRemaining: 0,
        isRunning: false,
        isExploded: true
      }));
      this.notificationsService.sendTimerCompletion('Bomb Timer');
    } else {
      this._bombTimerState.update(current => ({
        ...current,
        timeRemaining: newRemaining
      }));
    }
  }

  private updateMeditationTimer(): void {
    const state = this._meditationTimerState();
    if (!state.isRunning) return;

    const newRemaining = Math.max(0, state.timeRemaining - 10);
    
    if (newRemaining === 0) {
      // Phase completed
      if (state.currentPhase === 'in') {
        // Switch to breathe out
        this._meditationTimerState.update(current => ({
          ...current,
          currentPhase: 'out',
          timeRemaining: state.breatheOutDuration * 1000
        }));
      } else {
        // Breathe out completed, move to next cycle or complete
        if (state.currentCycle >= state.totalCycles) {
          this._meditationTimerState.update(current => ({
            ...current,
            isRunning: false,
            isCompleted: true,
            timeRemaining: 0
          }));
          this.notificationsService.sendTimerCompletion('Meditation Timer');
        } else {
          this._meditationTimerState.update(current => ({
            ...current,
            currentCycle: current.currentCycle + 1,
            currentPhase: 'in',
            timeRemaining: state.breatheInDuration * 1000
          }));
        }
      }
    } else {
      this._meditationTimerState.update(current => ({
        ...current,
        timeRemaining: newRemaining
      }));
    }
  }

  private updateBasketballTimer(): void {
    const state = this._basketballTimerState();
    if (!state.isRunning) return;

    const newRemaining = Math.max(0, state.timeRemaining - 10);
    
    if (newRemaining === 0) {
      this._basketballTimerState.update(current => ({
        ...current,
        timeRemaining: 0,
        isRunning: false
      }));
      this.notificationsService.sendTimerCompletion('Basketball Period');
    } else {
      this._basketballTimerState.update(current => ({
        ...current,
        timeRemaining: newRemaining
      }));
    }
  }

  private updateHockeyTimer(): void {
    const state = this._hockeyTimerState();
    if (!state.isRunning) return;

    const newRemaining = Math.max(0, state.timeRemaining - 10);
    
    if (newRemaining === 0) {
      this._hockeyTimerState.update(current => ({
        ...current,
        timeRemaining: 0,
        isRunning: false
      }));
      this.notificationsService.sendTimerCompletion('Hockey Period');
    } else {
      this._hockeyTimerState.update(current => ({
        ...current,
        timeRemaining: newRemaining
      }));
    }
  }

  private updatePresentationTimer(): void {
    const state = this._presentationTimerState();
    if (!state.isRunning) return;

    const newRemaining = Math.max(0, state.timeRemaining - 10);
    
    if (newRemaining === 0) {
      // Segment completed
      const currentSegment = state.segments[state.currentSegmentIndex];
      if (currentSegment) {
        this._presentationTimerState.update(current => ({
          ...current,
          timeRemaining: 0,
          isRunning: false,
          segments: current.segments.map((seg, idx) =>
            idx === current.currentSegmentIndex ? { ...seg, completed: true } : seg
          )
        }));
        this.notificationsService.sendTimerCompletion(`Presentation Segment: ${currentSegment.title}`);
      }
    } else {
      this._presentationTimerState.update(current => ({
        ...current,
        timeRemaining: newRemaining
      }));
    }
  }

  /**
   * Save current timer states for background persistence
   */
  saveTimerStates(): void {
    const states = {
      stopwatch: this._stopwatchState(),
      countdown: this._countdownState(),
      interval: this._intervalState(),
      pomodoro: this._pomodoroState(),
      eggTimer: this._eggTimerState(),
      bombTimer: this._bombTimerState(),
      meditationTimer: this._meditationTimerState(),
      basketballTimer: this._basketballTimerState(),
      hockeyTimer: this._hockeyTimerState(),
      presentationTimer: this._presentationTimerState(),
      timestamp: Date.now()
    };

    // Register sync event for background persistence
    this.backgroundSyncService.registerSyncEvent('timer-state-update', states);
    
    // Save using TimerApiService (which now uses localStorage)
    this.timerApiService.saveTimerStates(states).subscribe({
      next: (success) => {
        if (success) {
          console.log('[TimerService] Timer states saved to localStorage');
        } else {
          console.warn('[TimerService] Failed to save timer states to localStorage');
        }
      },
      error: (error) => {
        console.warn('[TimerService] Error saving timer states:', error);
      }
    });
  }

  /**
   * Restore timer states from localStorage
   */
  restoreTimerStates(): void {
    // Load states using TimerApiService (which now uses localStorage)
    this.timerApiService.loadTimerStates().subscribe({
      next: (savedStates) => {
        if (savedStates) {
          this.restoreFromStates(savedStates);
          console.log('[TimerService] Timer states restored from localStorage');
        }
      },
      error: (error) => {
        console.warn('[TimerService] Error loading timer states:', error);
      }
    });
  }

  private restoreFromStates(states: any): void {
    const timeElapsed = Date.now() - states.timestamp;

    // Restore stopwatch state
    if (states.stopwatch?.isRunning) {
      this._stopwatchState.update(state => ({
        ...state,
        ...states.stopwatch,
        timeElapsed: states.stopwatch.timeElapsed + timeElapsed
      }));
    } else if (states.stopwatch) {
      this._stopwatchState.set(states.stopwatch);
    }

    // Restore countdown state
    if (states.countdown?.isRunning) {
      const newTimeRemaining = Math.max(0, states.countdown.timeRemaining - timeElapsed);
      this._countdownState.update(state => ({
        ...state,
        ...states.countdown,
        timeRemaining: newTimeRemaining,
        isExpired: newTimeRemaining === 0
      }));
    } else if (states.countdown) {
      this._countdownState.set(states.countdown);
    }

    // Restore interval state
    if (states.interval?.isRunning) {
      const newTimeRemaining = Math.max(0, states.interval.timeRemaining - timeElapsed);
      this._intervalState.update(state => ({
        ...state,
        ...states.interval,
        timeRemaining: newTimeRemaining
      }));
    } else if (states.interval) {
      this._intervalState.set(states.interval);
    }

    // Restore pomodoro state
    if (states.pomodoro?.isRunning) {
      const newTimeRemaining = Math.max(0, states.pomodoro.timeRemaining - timeElapsed);
      this._pomodoroState.update(state => ({
        ...state,
        ...states.pomodoro,
        timeRemaining: newTimeRemaining
      }));
    } else if (states.pomodoro) {
      this._pomodoroState.set(states.pomodoro);
    }

    // Restore egg timer state
    if (states.eggTimer?.isRunning) {
      const newTimeRemaining = Math.max(0, states.eggTimer.timeRemaining - timeElapsed);
      this._eggTimerState.update(state => ({
        ...state,
        ...states.eggTimer,
        timeRemaining: newTimeRemaining,
        isCompleted: newTimeRemaining === 0
      }));
    } else if (states.eggTimer) {
      this._eggTimerState.set(states.eggTimer);
    }

    // Restore bomb timer state
    if (states.bombTimer?.isRunning) {
      const newTimeRemaining = Math.max(0, states.bombTimer.timeRemaining - timeElapsed);
      this._bombTimerState.update(state => ({
        ...state,
        ...states.bombTimer,
        timeRemaining: newTimeRemaining,
        isExploded: newTimeRemaining === 0
      }));
    } else if (states.bombTimer) {
      this._bombTimerState.set(states.bombTimer);
    }

    // Restore meditation timer state
    if (states.meditationTimer?.isRunning) {
      const newTimeRemaining = Math.max(0, states.meditationTimer.timeRemaining - timeElapsed);
      this._meditationTimerState.update(state => ({
        ...state,
        ...states.meditationTimer,
        timeRemaining: newTimeRemaining
      }));
    } else if (states.meditationTimer) {
      this._meditationTimerState.set(states.meditationTimer);
    }

    // Restore basketball timer state
    if (states.basketballTimer?.isRunning) {
      const newTimeRemaining = Math.max(0, states.basketballTimer.timeRemaining - timeElapsed);
      this._basketballTimerState.update(state => ({
        ...state,
        ...states.basketballTimer,
        timeRemaining: newTimeRemaining
      }));
    } else if (states.basketballTimer) {
      this._basketballTimerState.set(states.basketballTimer);
    }

    // Restore hockey timer state
    if (states.hockeyTimer?.isRunning) {
      const newTimeRemaining = Math.max(0, states.hockeyTimer.timeRemaining - timeElapsed);
      this._hockeyTimerState.update(state => ({
        ...state,
        ...states.hockeyTimer,
        timeRemaining: newTimeRemaining
      }));
    } else if (states.hockeyTimer) {
      this._hockeyTimerState.set(states.hockeyTimer);
    }

    // Restore presentation timer state
    if (states.presentationTimer?.isRunning) {
      const newTimeRemaining = Math.max(0, states.presentationTimer.timeRemaining - timeElapsed);
      this._presentationTimerState.update(state => ({
        ...state,
        ...states.presentationTimer,
        timeRemaining: newTimeRemaining
      }));
    } else if (states.presentationTimer) {
      this._presentationTimerState.set(states.presentationTimer);
    }
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((milliseconds % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  // Utility methods
  parseTimeInput(hours: number, minutes: number, seconds: number): number {
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  getLapTimes(): { lapNumber: number; lapTime: string; totalTime: string }[] {
    const laps = this._stopwatchState().laps;
    return laps.map((lapTime, index) => ({
      lapNumber: index + 1,
      lapTime: index === 0 
        ? this.formatTime(lapTime) 
        : this.formatTime(lapTime - laps[index - 1]),
      totalTime: this.formatTime(lapTime)
    }));
  }

  // Preset countdown times (in milliseconds)
  readonly presetTimes = {
    oneMinute: 60 * 1000,
    fiveMinutes: 5 * 60 * 1000,
    tenMinutes: 10 * 60 * 1000,
    fifteenMinutes: 15 * 60 * 1000,
    twentyFiveMinutes: 25 * 60 * 1000, // Pomodoro
    thirtyMinutes: 30 * 60 * 1000,
    oneHour: 60 * 60 * 1000
  };
}