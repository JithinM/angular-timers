import { ScullyConfig } from '@scullyio/scully';
import '@scullyio/scully-plugin-puppeteer';

export const config: ScullyConfig = {
  projectRoot: './dist/angular-timers/browser',
  projectName: 'angular-timers',
  outDir: './dist/static',
  distFolder: './dist/angular-timers/browser',
  sourceRoot: './src',
  routes: {
    '/': {
      type: 'default'
    },
    '/stopwatch': {
      type: 'default'
    },
    '/stopwatch/fullscreen': {
      type: 'default'
    },
    '/timer': {
      type: 'default'
    },
    '/timer/interval': {
      type: 'default'
    },
    '/timer/pomodoro': {
      type: 'default'
    },
    '/timer/meditation': {
      type: 'default'
    },
    '/clock': {
      type: 'default'
    },
    '/clock/alarm': {
      type: 'default'
    },
    '/clock/conversion': {
      type: 'default'
    },
    '/clock/days-between': {
      type: 'default'
    },
    '/fun/egg-timer': {
      type: 'default'
    },
    '/fun/bomb-timer': {
      type: 'default'
    },
    '/fun/classroom/basketball': {
      type: 'default'
    },
    '/fun/classroom/hockey': {
      type: 'default'
    },
    '/fun/classroom/presentation': {
      type: 'default'
    },
    '/settings': {
      type: 'default'
    },
    '/stats': {
      type: 'default'
    },
    '/achievements': {
      type: 'default'
    },
    '/about': {
      type: 'default'
    }
  },
  puppeteerLaunchOptions: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  defaultPostRenderers: []
};
