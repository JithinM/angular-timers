import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Free Online Timers & Stopwatches'
  },
  // Timer components
  {
    path: 'stopwatch',
    loadComponent: () => import('./features/stopwatch/stopwatch.component').then(m => m.StopwatchComponent),
    title: 'Stopwatch - Free Online Timer'
  },
  {
    path: 'timer',
    loadComponent: () => import('./features/countdown/countdown.component').then(m => m.CountdownComponent),
    title: 'Countdown Timer - Free Online Timer'
  },
  {
    path: 'timer/interval',
    loadComponent: () => import('./features/interval/interval.component').then(m => m.IntervalComponent),
    title: 'Interval Timer - Free Online Timer'
  },
  {
    path: 'timer/pomodoro',
    loadComponent: () => import('./features/pomodoro/pomodoro.component').then(m => m.PomodoroComponent),
    title: 'Pomodoro Timer - Free Online Timer'
  },
  {
    path: 'clock',
    loadComponent: () => import('./features/clock/clock.component').then(m => m.ClockComponent),
    title: 'World Clock - Free Online Clock'
  },
  {
    path: 'clock/alarm',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'fun/egg-timer',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'fun/bomb-timer',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'fun/classroom',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'settings',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'about',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
