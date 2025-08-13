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
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
  
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
      id: 'stopwatch',
      name: 'Stopwatch',
      description: 'Large display stopwatch perfect for presentations and events',
      icon: 'timer',
      route: '/stopwatch',
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