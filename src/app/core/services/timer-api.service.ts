import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private apiUrl = '/api/timer-states';

  constructor(private http: HttpClient) {}

  /**
   * Save timer states to server
   */
  saveTimerStates(states: TimerStates): Observable<boolean> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    return this.http.post<{ success: boolean }>(this.apiUrl, states, { headers })
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Failed to save timer states:', error);
          return of(false);
        })
      );
  }

  /**
   * Load timer states from server
   */
  loadTimerStates(): Observable<TimerStates | null> {
    return this.http.get<TimerStates>(this.apiUrl)
      .pipe(
        catchError(error => {
          console.error('Failed to load timer states:', error);
          return of(null);
        })
      );
  }

  /**
   * Sync timer states with server
   */
  syncTimerStates(states: TimerStates): Observable<boolean> {
    return this.saveTimerStates(states);
  }

  /**
   * Clear timer states from server
   */
  clearTimerStates(): Observable<boolean> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    return this.http.delete<{ success: boolean }>(this.apiUrl, { headers })
      .pipe(
        map(response => response.success),
        catchError(error => {
          console.error('Failed to clear timer states:', error);
          return of(false);
        })
      );
  }
}