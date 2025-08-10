# TimerTools - Angular Timers App

A comprehensive collection of free online timers, stopwatches, and timing tools built with Angular. This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Features

- **Stopwatch**: Simple stopwatch with lap functionality
- **Countdown Timer**: Set specific times with audio alerts
- **Interval Timer**: Perfect for workouts with alternating work/rest periods
- **Pomodoro Timer**: 25-minute focus sessions with breaks
- **Meditation Timer**: Guided breathing and meditation sessions
- **World Clock**: Multiple timezone support
- **Alarm Clock**: Multiple alarms with custom sounds
- **Fun Timers**: Egg timer, bomb timer, basketball timer, hockey timer, presentation timer
- **Statistics & Achievements**: Track your timing usage
- **PWA Support**: Install as a mobile app
- **Fullscreen Mode**: All timers support fullscreen with landscape orientation

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Static Site Generation with Scully

This app uses [Scully](https://scully.io/) for build-time prerendering, providing better SEO and performance.

### Scully Commands

- **Build with Scully**: `npm run build:scully` - Builds the app and generates static HTML files
- **Serve Scully build**: `npm run serve:scully` - Serves the static build locally
- **Scully only**: `npm run scully` - Runs Scully on an existing build

### Scully Configuration

The `scully.config.ts` file is configured for:
- **Main domain**: https://timersandtools.com
- **All routes**: Pre-rendered for SEO optimization
- **Output directory**: `./dist/static`
- **Puppeteer options**: Optimized for build environments

### Build Process

1. **Development**: `npm start` - Standard Angular dev server
2. **Production Build**: `npm run build:scully` - Creates static HTML files
3. **Deploy**: Upload `dist/static` contents to your web server

### SEO Features

- **Meta tags**: Optimized for search engines
- **Open Graph**: Social media sharing support
- **Twitter Cards**: Enhanced Twitter sharing
- **Canonical URLs**: Proper URL structure
- **Robots.txt**: Search engine crawling directives

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
