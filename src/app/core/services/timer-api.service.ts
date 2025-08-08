import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Timer state interfaces matching TimerService
interface TimerState {
  timeElapsed: number;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedTime: number;
  laps: number[];
}

interface CountdownState {
  initialTime: number;
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  isExpired: boolean;
}

interface IntervalState {
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

interface PomodoroState {
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  sessionsUntilLongBreak: number;
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

interface TimerStates {
  stopwatch: TimerState;
  countdown: CountdownState;
  interval: IntervalState;
  pomodoro: PomodoroState;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimerApiService {
  private readonly STORAGE_KEY = 'timer-states';

  constructor() {}

  /**
   * Save timer states to localStorage (no backend needed)
   */
  saveTimerStates(states: TimerStates): Observable<boolean> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
        return of(true);
      }
      return of(false);
    } catch (error) {
      console.error('Failed to save timer states to localStorage:', error);
      return of(false);
    }
  }

  /**
   * Load timer states from localStorage
   */
  loadTimerStates(): Observable<TimerStates | null> {
    try {
      if (typeof localStorage !== 'undefined') {
        const savedStates = localStorage.getItem(this.STORAGE_KEY);
        if (savedStates) {
          const states = JSON.parse(savedStates) as TimerStates;
          return of(states);
        }
      }
      return of(null);
    } catch (error) {
      console.error('Failed to load timer states from localStorage:', error);
      return of(null);
    }
  }

  /**
   * Sync timer states (same as save for localStorage-only implementation)
   */
  syncTimerStates(states: TimerStates): Observable<boolean> {
    return this.saveTimerStates(states);
  }

  /**
   * Clear timer states from localStorage
   */
  clearTimerStates(): Observable<boolean> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
        return of(true);
      }
      return of(false);
    } catch (error) {
      console.error('Failed to clear timer states from localStorage:', error);
      return of(false);
    }
  }
}