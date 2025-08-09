import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Timer state interfaces
export interface BaseTimerState {
  id: string;
  type: TimerType;
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  timeElapsed: number;
  timeRemaining: number;
  initialTime: number;
  route: string;
}

export interface StopwatchState extends BaseTimerState {
  type: 'stopwatch';
  laps: number[];
  pausedTime: number;
}

export interface CountdownState extends BaseTimerState {
  type: 'countdown';
  isExpired: boolean;
}

export interface IntervalState extends BaseTimerState {
  type: 'interval';
  workTime: number;
  restTime: number;
  totalCycles: number;
  currentCycle: number;
  isWorkPhase: boolean;
  isCompleted: boolean;
  totalWorkTime: number;
  totalRestTime: number;
}

export interface PomodoroState extends BaseTimerState {
  type: 'pomodoro';
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  sessionsUntilLongBreak: number;
  currentSession: number;
  currentSessionType: 'work' | 'shortBreak' | 'longBreak';
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

export interface EggTimerState extends BaseTimerState {
  type: 'eggTimer';
  isCompleted: boolean;
  selectedPreset: string | null;
}

export interface BombTimerState extends BaseTimerState {
  type: 'bombTimer';
  isExploded: boolean;
  isDefused: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MeditationTimerState extends BaseTimerState {
  type: 'meditationTimer';
  breatheInDuration: number;
  breatheOutDuration: number;
  totalCycles: number;
  currentPhase: 'in' | 'out' | 'hold';
  currentCycle: number;
  isCompleted: boolean;
  enableSound: boolean;
}

export interface BasketballTimerState extends BaseTimerState {
  type: 'basketballTimer';
  periodDuration: number;
  currentPeriod: number;
  totalPeriods: number;
  homeScore: number;
  awayScore: number;
}

export interface HockeyTimerState extends BaseTimerState {
  type: 'hockeyTimer';
  periodDuration: number;
  currentPeriod: number;
  totalPeriods: number;
  homePenalties: number;
  awayPenalties: number;
}

export interface PresentationTimerState extends BaseTimerState {
  type: 'presentationTimer';
  segments: PresentationSegment[];
  currentSegmentIndex: number;
  isPresentationComplete: boolean;
}

export interface PresentationSegment {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

export type TimerType = 
  | 'stopwatch' 
  | 'countdown' 
  | 'interval' 
  | 'pomodoro' 
  | 'eggTimer' 
  | 'bombTimer' 
  | 'meditationTimer' 
  | 'basketballTimer' 
  | 'hockeyTimer' 
  | 'presentationTimer';

export type TimerState = 
  | StopwatchState 
  | CountdownState 
  | IntervalState 
  | PomodoroState 
  | EggTimerState 
  | BombTimerState 
  | MeditationTimerState 
  | BasketballTimerState 
  | HockeyTimerState 
  | PresentationTimerState;

interface TimerStoreState {
  activeTimers: Record<string, TimerState>;
  currentRoute: string;
  lastUpdate: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimerStoreService {
  private readonly router = inject(Router);

  private readonly initialState: TimerStoreState = {
    activeTimers: {},
    currentRoute: '',
    lastUpdate: Date.now()
  };

  private readonly _state$ = new BehaviorSubject<TimerStoreState>(this.initialState);

  // Public observables
  readonly state$ = this._state$.asObservable();
  readonly activeTimers$ = this._state$.pipe(
    map(state => state.activeTimers),
    distinctUntilChanged()
  );
  readonly currentRoute$ = this._state$.pipe(
    map(state => state.currentRoute),
    distinctUntilChanged()
  );

  // Specific timer observables
  readonly runningTimers$ = this.activeTimers$.pipe(
    map(timers => Object.values(timers).filter(timer => timer.isRunning))
  );

  readonly hasRunningTimers$ = this.runningTimers$.pipe(
    map(timers => timers.length > 0)
  );

  constructor() {
    this.setupNavigationHandler();
  }

  /**
   * Setup navigation handler to detect route changes and handle timer cancellation
   */
  private setupNavigationHandler(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.handleNavigation(event.url);
      });
  }

  /**
   * Handle navigation between routes
   */
  private handleNavigation(newRoute: string): void {
    const currentState = this._state$.value;
    const previousRoute = currentState.currentRoute;

    // Update current route
    this.updateState(state => ({
      ...state,
      currentRoute: newRoute
    }));

    // Check if navigating between different timer routes
    const previousTimerType = this.getTimerTypeFromRoute(previousRoute);
    const newTimerType = this.getTimerTypeFromRoute(newRoute);

    if (previousTimerType && newTimerType && previousTimerType !== newTimerType) {
      // Cancel and reset timers from previous route
      this.cancelTimersForRoute(previousRoute);
    } else if (previousTimerType && !newTimerType) {
      // Navigating away from timer route to non-timer route
      // Keep timers running but mark route change
      this.updateTimersRoute(previousRoute, newRoute);
    }
  }

  /**
   * Get timer type from route
   */
  private getTimerTypeFromRoute(route: string): TimerType | null {
    if (!route) return null;

    const routeMap: Record<string, TimerType> = {
      '/stopwatch': 'stopwatch',
      '/timer': 'countdown',
      '/timer/interval': 'interval',
      '/timer/pomodoro': 'pomodoro',
      '/timer/meditation': 'meditationTimer',
      '/fun/egg-timer': 'eggTimer',
      '/fun/bomb-timer': 'bombTimer',
      '/fun/classroom/basketball': 'basketballTimer',
      '/fun/classroom/hockey': 'hockeyTimer',
      '/fun/classroom/presentation': 'presentationTimer'
    };

    for (const [routePattern, timerType] of Object.entries(routeMap)) {
      if (route.includes(routePattern)) {
        return timerType;
      }
    }

    return null;
  }

  /**
   * Cancel and reset all timers for a specific route
   */
  private cancelTimersForRoute(route: string): void {
    const timerType = this.getTimerTypeFromRoute(route);
    if (!timerType) return;

    this.updateState(state => ({
      ...state,
      activeTimers: Object.fromEntries(
        Object.entries(state.activeTimers).filter(([_, timer]) => timer.type !== timerType)
      ),
      lastUpdate: Date.now()
    }));

    console.log(`[TimerStore] Cancelled all ${timerType} timers due to navigation`);
  }

  /**
   * Update route for existing timers without cancelling them
   */
  private updateTimersRoute(oldRoute: string, newRoute: string): void {
    this.updateState(state => ({
      ...state,
      activeTimers: Object.fromEntries(
        Object.entries(state.activeTimers).map(([id, timer]) => [
          id,
          timer.route === oldRoute ? { ...timer, route: newRoute } : timer
        ])
      ),
      lastUpdate: Date.now()
    }));
  }

  /**
   * Add or update a timer in the store
   */
  setTimer(timer: TimerState): void {
    // If starting a new timer of different type, cancel existing running timers
    const runningTimers = Object.values(this._state$.value.activeTimers).filter(t => t.isRunning);
    const hasRunningDifferentType = runningTimers.some(t => t.type !== timer.type && t.isRunning);

    if (timer.isRunning && hasRunningDifferentType) {
      // Cancel all other running timers
      this.updateState(state => ({
        ...state,
        activeTimers: {
          ...Object.fromEntries(
            Object.entries(state.activeTimers).map(([id, t]) => [
              id,
              t.type !== timer.type ? { ...t, isRunning: false, isPaused: true } : t
            ])
          ),
          [timer.id]: timer
        },
        lastUpdate: Date.now()
      }));

      console.log(`[TimerStore] Cancelled other running timers to start ${timer.type}`);
    } else {
      // Just update the timer
      this.updateState(state => ({
        ...state,
        activeTimers: {
          ...state.activeTimers,
          [timer.id]: timer
        },
        lastUpdate: Date.now()
      }));
    }
  }

  /**
   * Get a specific timer by ID
   */
  getTimer(id: string): Observable<TimerState | undefined> {
    return this.activeTimers$.pipe(
      map(timers => timers[id])
    );
  }

  /**
   * Get all timers of a specific type
   */
  getTimersByType(type: TimerType): Observable<TimerState[]> {
    return this.activeTimers$.pipe(
      map(timers => Object.values(timers).filter(timer => timer.type === type))
    );
  }

  /**
   * Remove a timer from the store
   */
  removeTimer(id: string): void {
    this.updateState(state => {
      const { [id]: removed, ...remaining } = state.activeTimers;
      return {
        ...state,
        activeTimers: remaining,
        lastUpdate: Date.now()
      };
    });
  }

  /**
   * Clear all timers
   */
  clearAllTimers(): void {
    this.updateState(state => ({
      ...state,
      activeTimers: {},
      lastUpdate: Date.now()
    }));
  }

  /**
   * Cancel all running timers
   */
  cancelAllRunningTimers(): void {
    this.updateState(state => ({
      ...state,
      activeTimers: Object.fromEntries(
        Object.entries(state.activeTimers).map(([id, timer]) => [
          id,
          { ...timer, isRunning: false, isPaused: true }
        ])
      ),
      lastUpdate: Date.now()
    }));

    console.log('[TimerStore] Cancelled all running timers');
  }

  /**
   * Get the current state snapshot
   */
  getCurrentState(): TimerStoreState {
    return this._state$.value;
  }

  /**
   * Update state with a function
   */
  private updateState(updateFn: (state: TimerStoreState) => TimerStoreState): void {
    const currentState = this._state$.value;
    const newState = updateFn(currentState);
    this._state$.next(newState);
  }

  /**
   * Create a default timer state
   */
  createDefaultTimer(type: TimerType, route: string): Partial<BaseTimerState> {
    return {
      id: this.generateTimerId(type),
      type,
      isRunning: false,
      isPaused: false,
      startTime: null,
      timeElapsed: 0,
      timeRemaining: 0,
      initialTime: 0,
      route
    };
  }

  /**
   * Generate a unique timer ID
   */
  generateTimerId(type: TimerType): string {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export timer states for persistence
   */
  exportState(): TimerStoreState {
    return this._state$.value;
  }

  /**
   * Import timer states from persistence
   */
  importState(state: TimerStoreState): void {
    this._state$.next({
      ...state,
      lastUpdate: Date.now()
    });
  }
}