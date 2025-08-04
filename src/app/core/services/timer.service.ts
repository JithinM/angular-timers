import { Injectable, signal, computed, effect, inject } from '@angular/core';
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

  // Interval reference for timer updates
  private intervalId: number | null = null;

  // Public readonly signals
  readonly stopwatchState = this._stopwatchState.asReadonly();
  readonly countdownState = this._countdownState.asReadonly();
  readonly intervalState = this._intervalState.asReadonly();
  readonly pomodoroState = this._pomodoroState.asReadonly();

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
      
      if (stopwatch.isRunning || countdown.isRunning || interval.isRunning || pomodoro.isRunning) {
        this.startInterval();
      } else {
        this.stopInterval();
      }
    });
  }

  // Stopwatch methods
  startStopwatch(): void {
    this._stopwatchState.update(state => ({
      ...state,
      isRunning: true,
      isPaused: false,
      startTime: state.startTime || Date.now() - state.timeElapsed
    }));
  }

  stopStopwatch(): void {
    this._stopwatchState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: true
    }));
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
    }
  }

  stopCountdown(): void {
    this._countdownState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: true
    }));
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
    }
  }

  stopIntervalTimer(): void {
    this._intervalState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: true
    }));
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
    }
  }

  stopPomodoroTimer(): void {
    this._pomodoroState.update(state => ({
      ...state,
      isRunning: false,
      isPaused: true
    }));
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
  }

  /**
   * Save current timer states to localStorage for background persistence
   */
  saveTimerStates(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const states = {
        stopwatch: this._stopwatchState(),
        countdown: this._countdownState(),
        interval: this._intervalState(),
        pomodoro: this._pomodoroState(),
        timestamp: Date.now()
      };

      localStorage.setItem('timer-states', JSON.stringify(states));
      
      // Register sync event for background persistence
      this.backgroundSyncService.registerSyncEvent('timer-state-update', states);
      
      // Save to server
      this.timerApiService.saveTimerStates(states).subscribe({
        next: (success) => {
          if (success) {
            console.log('[TimerService] Timer states saved to server');
          } else {
            console.warn('[TimerService] Failed to save timer states to server');
          }
        },
        error: (error) => {
          console.warn('[TimerService] Error saving timer states to server:', error);
        }
      });
    } catch (error) {
      console.warn('Failed to save timer states:', error);
    }
  }

  /**
   * Restore timer states from localStorage
   */
  restoreTimerStates(): void {
    if (typeof localStorage === 'undefined') return;

    // First try to restore from server
    this.timerApiService.loadTimerStates().subscribe({
      next: (serverStates) => {
        if (serverStates) {
          this.restoreFromStates(serverStates);
          console.log('[TimerService] Timer states restored from server');
        } else {
          // If no server states, try localStorage
          this.restoreFromLocalStorage();
        }
      },
      error: (error) => {
        console.warn('[TimerService] Error loading timer states from server:', error);
        // Fallback to localStorage
        this.restoreFromLocalStorage();
      }
    });
  }

  private restoreFromLocalStorage(): void {
    try {
      const savedStates = localStorage.getItem('timer-states');
      if (!savedStates) return;

      const states = JSON.parse(savedStates);
      this.restoreFromStates(states);
      console.log('[TimerService] Timer states restored from localStorage');
    } catch (error) {
      console.warn('Failed to restore timer states from localStorage:', error);
    }
  }

  private restoreFromStates(states: any): void {
    const timeElapsed = Date.now() - states.timestamp;

    // Restore stopwatch state
    if (states.stopwatch.isRunning) {
      this._stopwatchState.update(state => ({
        ...state,
        ...states.stopwatch,
        timeElapsed: states.stopwatch.timeElapsed + timeElapsed
      }));
    } else {
      this._stopwatchState.set(states.stopwatch);
    }

    // Restore countdown state
    if (states.countdown.isRunning) {
      const newTimeRemaining = Math.max(0, states.countdown.timeRemaining - timeElapsed);
      this._countdownState.update(state => ({
        ...state,
        ...states.countdown,
        timeRemaining: newTimeRemaining,
        isExpired: newTimeRemaining === 0
      }));
    } else {
      this._countdownState.set(states.countdown);
    }

    // Restore interval state
    if (states.interval.isRunning) {
      const newTimeRemaining = Math.max(0, states.interval.timeRemaining - timeElapsed);
      this._intervalState.update(state => ({
        ...state,
        ...states.interval,
        timeRemaining: newTimeRemaining
      }));
    } else {
      this._intervalState.set(states.interval);
    }

    // Restore pomodoro state
    if (states.pomodoro.isRunning) {
      const newTimeRemaining = Math.max(0, states.pomodoro.timeRemaining - timeElapsed);
      this._pomodoroState.update(state => ({
        ...state,
        ...states.pomodoro,
        timeRemaining: newTimeRemaining
      }));
    } else {
      this._pomodoroState.set(states.pomodoro);
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