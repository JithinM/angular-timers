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
    path: 'stopwatch/fullscreen',
    loadComponent: () => import('./features/stopwatch/fullscreen-stopwatch.component').then(m => m.FullscreenStopwatchComponent),
    title: 'Fullscreen Stopwatch - Free Online Timer'
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
    path: 'timer/meditation',
    loadComponent: () => import('./features/meditation/meditation-timer.component').then(m => m.MeditationTimerComponent),
    title: 'Meditation Timer - Guided Breathing'
  },
  {
    path: 'clock',
    loadComponent: () => import('./features/clock/clock.component').then(m => m.ClockComponent),
    title: 'World Clock - Free Online Clock'
  },
  {
    path: 'clock/alarm',
    loadComponent: () => import('./features/clock/alarm-clock.component').then(m => m.AlarmClockComponent),
    title: 'Alarm Clock - Free Online Clock'
  },
  {
    path: 'clock/conversion',
    loadComponent: () => import('./features/clock/time-conversion.component').then(m => m.TimeConversionComponent),
    title: 'Time Conversion Tool - UTC Unix Timestamp'
  },
  {
    path: 'clock/days-between',
    loadComponent: () => import('./features/clock/days-between.component').then(m => m.DaysBetweenComponent),
    title: 'Days Between Dates Calculator'
  },
  {
    path: 'fun/egg-timer',
    loadComponent: () => import('./features/fun/egg-timer.component').then(m => m.EggTimerComponent),
    title: 'Egg Timer - Free Online Timer'
  },
  {
    path: 'fun/bomb-timer',
    loadComponent: () => import('./features/fun/bomb-timer.component').then(m => m.BombTimerComponent),
    title: 'Bomb Timer - Free Online Timer'
  },
  {
    path: 'fun/classroom/basketball',
    loadComponent: () => import('./features/fun/classroom/basketball-timer.component').then(m => m.BasketballTimerComponent),
    title: 'Basketball Timer - Free Online Timer'
  },
  {
    path: 'fun/classroom/hockey',
    loadComponent: () => import('./features/fun/classroom/hockey-timer.component').then(m => m.HockeyTimerComponent),
    title: 'Hockey Timer - Free Online Timer'
  },
  {
    path: 'fun/classroom/presentation',
    loadComponent: () => import('./features/fun/classroom/presentation-timer.component').then(m => m.PresentationTimerComponent),
    title: 'Presentation Timer - Free Online Timer'
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    title: 'Settings - TimerTools'
  },
  {
    path: 'stats',
    loadComponent: () => import('./features/stats/stats.component').then(m => m.StatsComponent),
    title: 'Statistics - TimerTools'
  },
  {
    path: 'achievements',
    loadComponent: () => import('./features/achievements/achievements.component').then(m => m.AchievementsComponent),
    title: 'Achievements - TimerTools'
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent),
    title: 'About TimerTools - Free Online Timers'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
