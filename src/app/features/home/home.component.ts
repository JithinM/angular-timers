import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { ControlButtonsComponent, TimerAction } from '../../shared/components/control-buttons/control-buttons.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { TimerService } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { StorageService } from '../../core/services/storage.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';

interface TimerTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  category: 'stopwatch' | 'timer' | 'clock' | 'fun';
  featured: boolean;
  popular: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    TimeDisplayComponent,
    ControlButtonsComponent,
    AdSlotComponent
  ],
  template: `
    <div class="home-container">
      <!-- Top Ad Banner -->
      <app-ad-slot 
        size="banner" 
        position="top"
        [showPlaceholder]="true"
        class="no-print">
      </app-ad-slot>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="container">
          <h1 class="hero-title">
            Free Online Timers & Stopwatches
          </h1>
          <p class="hero-subtitle">
            Perfect timing tools for cooking, exercise, study sessions, and work breaks
          </p>
        </div>
      </section>

      <!-- Featured Timers Section -->
      <section class="featured-section">
        <div class="container">
          <h2 class="section-title">Quick Access Timers</h2>
          
          <div class="featured-timers">
            <!-- Embedded Stopwatch -->
            <mat-card class="timer-card stopwatch-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>timer</mat-icon>
                  Stopwatch
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <app-time-display
                  [time]="timerService.formattedStopwatchTime()"
                  [status]="timerService.stopwatchStatus()"
                  size="medium">
                </app-time-display>
                
                <app-control-buttons
                  [isRunning]="timerService.stopwatchState().isRunning"
                  [showLap]="true"
                  [showFullscreen]="false"
                  [showSettings]="false"
                  layout="horizontal"
                  (action)="onStopwatchAction($event)">
                </app-control-buttons>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-button routerLink="/stopwatch">
                  <mat-icon>open_in_new</mat-icon>
                  Full View
                </button>
              </mat-card-actions>
            </mat-card>

            <!-- Embedded Countdown Timer -->
            <mat-card class="timer-card countdown-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>hourglass_empty</mat-icon>
                  Countdown Timer
                </mat-card-title>
              </mat-card-header>
              
              <mat-card-content>
                <div class="preset-buttons">
                  <button 
                    *ngFor="let preset of quickPresets" 
                    mat-stroked-button
                    class="preset-btn"
                    (click)="setCountdownPreset(preset.value)"
                    [class.active]="timerService.countdownState().initialTime === preset.value"
                  >
                    {{ preset.label }}
                  </button>
                </div>
                
                <app-time-display
                  [time]="timerService.formattedCountdownTime()"
                  [status]="timerService.countdownStatus()"
                  size="medium">
                </app-time-display>
                
                <app-control-buttons
                  [isRunning]="timerService.countdownState().isRunning"
                  [showLap]="false"
                  [showFullscreen]="false"
                  [showSettings]="false"
                  layout="horizontal"
                  (action)="onCountdownAction($event)">
                </app-control-buttons>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-button routerLink="/timer">
                  <mat-icon>open_in_new</mat-icon>
                  Full View
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>
      </section>

      <!-- Tools Grid Section -->
      <section class="tools-section">
        <div class="container">
          <h2 class="section-title">All Timer Tools</h2>
          
          <div class="tools-grid">
            <mat-card 
              *ngFor="let tool of timerTools" 
              class="tool-card"
              [routerLink]="tool.route"
              [class.featured]="tool.featured"
              [class.popular]="tool.popular"
            >
              <mat-card-header>
                <div mat-card-avatar>
                  <mat-icon [color]="getCategoryColor(tool.category)">{{ tool.icon }}</mat-icon>
                </div>
                <mat-card-title>{{ tool.name }}</mat-card-title>
                <mat-card-subtitle>{{ tool.category | titlecase }}</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <p>{{ tool.description }}</p>
                
                <div class="tool-badges">
                  <mat-chip *ngIf="tool.featured" color="accent" selected>
                    <mat-icon>star</mat-icon>
                    Featured
                  </mat-chip>
                  <mat-chip *ngIf="tool.popular" color="primary" selected>
                    <mat-icon>trending_up</mat-icon>
                    Popular
                  </mat-chip>
                </div>
              </mat-card-content>
              
              <mat-card-actions>
                <button mat-button color="primary">
                  <mat-icon>play_arrow</mat-icon>
                  Start Timer
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>
      </section>

      <!-- Sidebar Ad (Desktop) -->
      <app-ad-slot 
        size="rectangle" 
        position="sidebar"
        [showPlaceholder]="true"
        class="sidebar-ad no-print hide-mobile">
      </app-ad-slot>

      <!-- Recent Activity Section -->
      <section class="recent-section" *ngIf="recentHistory.length > 0">
        <div class="container">
          <h2 class="section-title">Recent Activity</h2>
          
          <div class="recent-list">
            <mat-card *ngFor="let entry of recentHistory; trackBy: trackByHistoryId" class="recent-item">
              <mat-card-content>
                <div class="recent-content">
                  <div class="recent-info">
                    <mat-icon>{{ getHistoryIcon(entry.type) }}</mat-icon>
                    <div class="recent-details">
                      <span class="recent-type">{{ entry.type | titlecase }}</span>
                      <span class="recent-duration">{{ formatDuration(entry.duration) }}</span>
                      <span class="recent-time">{{ formatRelativeTime(entry.timestamp) }}</span>
                    </div>
                  </div>
                  <button 
                    mat-icon-button 
                    color="primary"
                    [attr.aria-label]="'Repeat ' + entry.type + ' timer'"
                    (click)="repeatTimer(entry)"
                  >
                    <mat-icon>replay</mat-icon>
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </section>

      <!-- Bottom Ad Banner -->
      <app-ad-slot 
        size="banner" 
        position="bottom"
        [showPlaceholder]="true"
        class="no-print">
      </app-ad-slot>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }

    /* Hero Section */
    .hero-section {
      padding: 3rem 0 2rem;
      text-align: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, #1565c0 100%);
      color: white;
      margin-bottom: 2rem;
    }

    .hero-title {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 300;
      margin-bottom: 1rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .hero-subtitle {
      font-size: clamp(1rem, 2.5vw, 1.25rem);
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* Section Styling */
    .section-title {
      font-size: 2rem;
      font-weight: 300;
      text-align: center;
      margin: 3rem 0 2rem;
      color: var(--text-primary);
    }

    /* Featured Timers Section */
    .featured-section {
      padding: 2rem 0;
    }

    .featured-timers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .timer-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .timer-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .timer-card mat-card-header {
      margin-bottom: 1rem;
    }

    .timer-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
    }

    .preset-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
      justify-content: center;
    }

    .preset-btn {
      min-width: auto;
      padding: 0 12px;
      height: 32px;
      font-size: 0.75rem;
      transition: all 0.2s ease;
    }

    .preset-btn.active {
      background-color: var(--primary-color);
      color: white;
    }

    /* Tools Grid */
    .tools-section {
      padding: 2rem 0;
      background: white;
    }

    .tools-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .tool-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 8px;
      overflow: hidden;
    }

    .tool-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }

    .tool-card.featured {
      border: 2px solid var(--accent-color);
    }

    .tool-card.popular {
      border: 2px solid var(--primary-color);
    }

    .tool-card mat-card-avatar {
      background: transparent;
    }

    .tool-card mat-card-avatar mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .tool-badges {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .tool-badges mat-chip {
      font-size: 0.75rem;
      height: 24px;
    }

    .tool-badges mat-chip mat-icon {
      font-size: 0.875rem;
      width: 0.875rem;
      height: 0.875rem;
    }

    /* Recent Activity */
    .recent-section {
      padding: 2rem 0;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .recent-item {
      background: white;
      border-radius: 8px;
    }

    .recent-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .recent-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .recent-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .recent-type {
      font-weight: 500;
      color: var(--text-primary);
    }

    .recent-duration {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .recent-time {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* Sidebar Ad */
    .sidebar-ad {
      position: fixed;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 5;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .hero-section {
        padding: 2rem 0 1.5rem;
      }

      .featured-timers {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .tools-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
      }

      .container {
        padding: 0 12px;
      }

      .sidebar-ad {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .preset-buttons {
        justify-content: stretch;
      }

      .preset-btn {
        flex: 1;
        min-width: 60px;
      }

      .tools-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Print styles */
    @media print {
      .no-print {
        display: none !important;
      }
      
      .hero-section {
        background: white !important;
        color: black !important;
      }
    }

    /* High contrast support */
    @media (prefers-contrast: high) {
      .timer-card,
      .tool-card,
      .recent-item {
        border: 2px solid currentColor;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .timer-card,
      .tool-card {
        transition: none;
      }
      
      .timer-card:hover,
      .tool-card:hover {
        transform: none;
      }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  quickPresets = [
    { label: '1m', value: 60000 },
    { label: '5m', value: 300000 },
    { label: '10m', value: 600000 },
    { label: '25m', value: 1500000 } // Pomodoro
  ];

  timerTools: TimerTool[] = [
    {
      id: 'basic-stopwatch',
      name: 'Basic Stopwatch',
      description: 'Simple stopwatch with lap functionality for timing activities',
      icon: 'timer',
      route: '/stopwatch',
      category: 'stopwatch',
      featured: true,
      popular: true
    },
    {
      id: 'countdown-timer',
      name: 'Countdown Timer',
      description: 'Set a specific time and count down with audio alerts',
      icon: 'hourglass_empty',
      route: '/timer',
      category: 'timer',
      featured: true,
      popular: true
    },
    {
      id: 'interval-timer',
      name: 'Interval Timer',
      description: 'Perfect for workouts with alternating work and rest periods',
      icon: 'fitness_center',
      route: '/timer/interval',
      category: 'timer',
      featured: false,
      popular: true
    },
    {
      id: 'pomodoro-timer',
      name: 'Pomodoro Timer',
      description: '25-minute focus sessions with 5-minute breaks for productivity',
      icon: 'work',
      route: '/timer/pomodoro',
      category: 'timer',
      featured: false,
      popular: true
    },
    {
      id: 'fullscreen-stopwatch',
      name: 'Full Screen Stopwatch',
      description: 'Large display stopwatch perfect for presentations and events',
      icon: 'fullscreen',
      route: '/stopwatch/fullscreen',
      category: 'stopwatch',
      featured: false,
      popular: false
    },
    {
      id: 'digital-clock',
      name: 'Digital Clock',
      description: 'Current time display with multiple timezone support',
      icon: 'schedule',
      route: '/clock',
      category: 'clock',
      featured: false,
      popular: false
    },
    {
      id: 'alarm-clock',
      name: 'Alarm Clock',
      description: 'Set multiple alarms with custom sounds and snooze',
      icon: 'alarm',
      route: '/clock/alarm',
      category: 'clock',
      featured: false,
      popular: false
    },
    {
      id: 'egg-timer',
      name: 'Egg Timer',
      description: 'Classic egg timer for cooking with preset times',
      icon: 'egg',
      route: '/fun/egg-timer',
      category: 'fun',
      featured: false,
      popular: false
    },
    {
      id: 'bomb-timer',
      name: 'Bomb Timer',
      description: 'Exciting countdown timer with explosive visuals',
      icon: 'whatshot',
      route: '/fun/bomb-timer',
      category: 'fun',
      featured: false,
      popular: false
    }
  ];

  recentHistory: any[] = [];

  constructor(
    public timerService: TimerService,
    private audioService: AudioService,
    private storageService: StorageService,
    private backgroundTimerService: BackgroundTimerService
  ) {}

  ngOnInit(): void {
    this.loadRecentHistory();
    
    // Resume audio context on user interaction
    this.audioService.resumeAudioContext();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  onStopwatchAction(action: TimerAction): void {
    this.audioService.playButtonClick();
    
    switch (action.action) {
      case 'start':
        this.timerService.startStopwatch();
        this.timerService.saveTimerStates();
        break;
      case 'stop':
        this.timerService.stopStopwatch();
        this.timerService.saveTimerStates();
        break;
      case 'reset':
        this.timerService.resetStopwatch();
        this.timerService.saveTimerStates();
        break;
      case 'lap':
        this.timerService.addLap();
        this.audioService.playLapSound();
        this.timerService.saveTimerStates();
        break;
    }
  }

  onCountdownAction(action: TimerAction): void {
    this.audioService.playButtonClick();
    
    switch (action.action) {
      case 'start':
        this.timerService.startCountdown();
        this.timerService.saveTimerStates();
        break;
      case 'stop':
        this.timerService.stopCountdown();
        this.timerService.saveTimerStates();
        break;
      case 'reset':
        this.timerService.resetCountdown();
        this.timerService.saveTimerStates();
        break;
    }
  }

  setCountdownPreset(milliseconds: number): void {
    this.audioService.playButtonClick();
    this.timerService.setCountdownTime(milliseconds);
    this.timerService.saveTimerStates();
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'stopwatch': return 'primary';
      case 'timer': return 'accent';
      case 'clock': return 'warn';
      case 'fun': return 'primary';
      default: return 'primary';
    }
  }

  private loadRecentHistory(): void {
    this.recentHistory = this.storageService.getRecentHistory(5);
  }

  trackByHistoryId(index: number, item: any): string {
    return item.id;
  }

  getHistoryIcon(type: string): string {
    switch (type) {
      case 'stopwatch': return 'timer';
      case 'countdown': return 'hourglass_empty';
      case 'interval': return 'fitness_center';
      default: return 'timer';
    }
  }

  formatDuration(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  repeatTimer(entry: any): void {
    this.audioService.playButtonClick();
    
    switch (entry.type) {
      case 'countdown':
        this.timerService.setCountdownTime(entry.duration);
        this.timerService.saveTimerStates();
        break;
      // Add other timer types as needed
    }
  }
}