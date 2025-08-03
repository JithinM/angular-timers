import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { ControlButtonsComponent, TimerAction } from '../../shared/components/control-buttons/control-buttons.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { TimerService } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { StorageService } from '../../core/services/storage.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';

@Component({
  selector: 'app-stopwatch',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    TimeDisplayComponent,
    ControlButtonsComponent,
    AdSlotComponent
  ],
  template: `
    <div class="stopwatch-container">
      <!-- Top Ad Banner -->
      <app-ad-slot 
        size="banner" 
        position="top"
        [showPlaceholder]="true"
        class="no-print">
      </app-ad-slot>

      <!-- Header -->
      <header class="stopwatch-header">
        <h1>
          <mat-icon>timer</mat-icon>
          Stopwatch
        </h1>
        <p>Precise timing with lap functionality</p>
      </header>

      <!-- Main Timer Display -->
      <section class="timer-section">
        <mat-card class="timer-card">
          <mat-card-content>
            <app-time-display
              [time]="timerService.formattedStopwatchTime()"
              [status]="timerService.stopwatchStatus()"
              size="large"
              [animate]="true">
            </app-time-display>
            
            <app-control-buttons
              [isRunning]="timerService.stopwatchState().isRunning"
              [showLap]="true"
              [showFullscreen]="true"
              [showSettings]="true"
              [isFullscreen]="isFullscreen"
              layout="vertical"
              (action)="onTimerAction($event)">
            </app-control-buttons>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Lap Times Section -->
      <section class="laps-section" *ngIf="lapTimes.length > 0">
        <mat-card class="laps-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>flag</mat-icon>
              Lap Times
            </mat-card-title>
            <div class="lap-actions">
              <button 
                mat-icon-button 
                (click)="exportLaps()"
                [attr.aria-label]="'Export lap times'"
                title="Export lap times">
                <mat-icon>download</mat-icon>
              </button>
              <button 
                mat-icon-button 
                (click)="clearLaps()"
                [attr.aria-label]="'Clear all laps'"
                title="Clear all laps"
                color="warn">
                <mat-icon>clear_all</mat-icon>
              </button>
            </div>
          </mat-card-header>
          
          <mat-card-content>
            <mat-list class="lap-list">
              <mat-list-item 
                *ngFor="let lap of lapTimes; trackBy: trackByLapNumber; let isLast = last"
                [class.fastest]="lap.lapNumber === fastestLap"
                [class.slowest]="lap.lapNumber === slowestLap && lapTimes.length > 2"
              >
                <div matListItemTitle class="lap-item">
                  <span class="lap-number">{{ lap.lapNumber }}</span>
                  <span class="lap-time">{{ lap.lapTime }}</span>
                  <span class="total-time">{{ lap.totalTime }}</span>
                </div>
                <mat-divider *ngIf="!isLast"></mat-divider>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Keyboard Shortcuts Info -->
      <section class="shortcuts-section">
        <mat-card class="shortcuts-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>keyboard</mat-icon>
              Keyboard Shortcuts
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="shortcuts-grid">
              <div class="shortcut-item">
                <kbd>Space</kbd>
                <span>Start / Stop</span>
              </div>
              <div class="shortcut-item">
                <kbd>R</kbd>
                <span>Reset</span>
              </div>
              <div class="shortcut-item">
                <kbd>L</kbd>
                <span>Add Lap</span>
              </div>
              <div class="shortcut-item">
                <kbd>F</kbd>
                <span>Fullscreen</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
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
    .stopwatch-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .stopwatch-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .stopwatch-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .stopwatch-header p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .timer-section {
      margin-bottom: 2rem;
    }

    .timer-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      padding: 1rem;
    }

    .laps-section {
      margin-bottom: 2rem;
    }

    .laps-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .laps-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .lap-actions {
      display: flex;
      gap: 0.5rem;
    }

    .lap-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .lap-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      font-family: 'Roboto Mono', monospace;
    }

    .lap-number {
      font-weight: 500;
      color: var(--text-secondary);
      min-width: 60px;
    }

    .lap-time {
      font-weight: 600;
      color: var(--primary-color);
      text-align: center;
      flex: 1;
    }

    .total-time {
      color: var(--text-secondary);
      font-size: 0.875rem;
      min-width: 80px;
      text-align: right;
    }

    .fastest .lap-time {
      color: var(--success-color);
      font-weight: 700;
    }

    .slowest .lap-time {
      color: var(--warn-color);
    }

    .shortcuts-section {
      margin-bottom: 2rem;
    }

    .shortcuts-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }

    .shortcut-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-align: center;
    }

    kbd {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .stopwatch-container {
        padding: 0.75rem;
      }

      .stopwatch-header h1 {
        font-size: 2rem;
      }

      .shortcuts-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .lap-item {
        font-size: 0.875rem;
      }
    }

    @media (max-width: 480px) {
      .stopwatch-header {
        margin-bottom: 1.5rem;
      }

      .lap-actions {
        flex-direction: column;
      }
    }

    /* Print styles */
    @media print {
      .no-print {
        display: none !important;
      }
      
      .stopwatch-container {
        background: white !important;
      }
    }

    /* Fullscreen styles */
    :host(.fullscreen) .stopwatch-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      background: #000;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    :host(.fullscreen) .timer-card {
      background: transparent;
      box-shadow: none;
    }

    :host(.fullscreen) .laps-section,
    :host(.fullscreen) .shortcuts-section {
      display: none;
    }
  `],
  host: {
    '[class.fullscreen]': 'isFullscreen'
  }
})
export class StopwatchComponent implements OnInit, OnDestroy {
  isFullscreen = false;
  lapTimes: any[] = [];
  fastestLap: number | null = null;
  slowestLap: number | null = null;

  constructor(
    public timerService: TimerService,
    private audioService: AudioService,
    private storageService: StorageService,
    private backgroundTimerService: BackgroundTimerService
  ) {}

  ngOnInit(): void {
    this.setupKeyboardShortcuts();
    this.updateLapTimes();
    
    // Resume audio context on user interaction
    this.audioService.resumeAudioContext();
  }

  ngOnDestroy(): void {
    this.removeKeyboardShortcuts();
    if (this.isFullscreen) {
      this.exitFullscreen();
    }
  }

  onTimerAction(action: TimerAction): void {
    this.audioService.playButtonClick();
    
    switch (action.action) {
      case 'start':
        this.timerService.startStopwatch();
        this.timerService.saveTimerStates();
        break;
      case 'stop':
        this.timerService.stopStopwatch();
        this.saveToHistory();
        this.timerService.saveTimerStates();
        break;
      case 'reset':
        this.timerService.resetStopwatch();
        this.updateLapTimes();
        this.timerService.saveTimerStates();
        break;
      case 'lap':
        this.timerService.addLap();
        this.audioService.playLapSound();
        this.updateLapTimes();
        break;
      case 'fullscreen':
        this.toggleFullscreen();
        break;
      case 'settings':
        // Open settings modal or navigate to settings
        break;
    }
  }

  private updateLapTimes(): void {
    this.lapTimes = this.timerService.getLapTimes();
    this.calculateFastestSlowest();
  }

  private calculateFastestSlowest(): void {
    if (this.lapTimes.length < 2) {
      this.fastestLap = null;
      this.slowestLap = null;
      return;
    }

    const lapDurations = this.lapTimes.map((lap, index) => {
      const duration = index === 0 
        ? lap.lapTime 
        : this.lapTimes[index].totalTime - this.lapTimes[index - 1].totalTime;
      return { lapNumber: lap.lapNumber, duration };
    });

    const sorted = [...lapDurations].sort((a, b) => a.duration - b.duration);
    this.fastestLap = sorted[0].lapNumber;
    this.slowestLap = sorted[sorted.length - 1].lapNumber;
  }

  exportLaps(): void {
    if (this.lapTimes.length === 0) return;
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const csvContent = [
      'Lap,Lap Time,Total Time',
      ...this.lapTimes.map(lap => `${lap.lapNumber},${lap.lapTime},${lap.totalTime}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stopwatch-laps-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.audioService.playButtonClick();
  }

  clearLaps(): void {
    this.timerService.resetStopwatch();
    this.updateLapTimes();
    this.audioService.playButtonClick();
  }

  private toggleFullscreen(): void {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  private enterFullscreen(): void {
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
    this.isFullscreen = true;
  }

  private exitFullscreen(): void {
    if (typeof document !== 'undefined' && document.exitFullscreen) {
      document.exitFullscreen();
    }
    this.isFullscreen = false;
  }

  private setupKeyboardShortcuts(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    }
  }

  private removeKeyboardShortcuts(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    // Ignore if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case ' ':
        event.preventDefault();
        this.onTimerAction({ action: this.timerService.stopwatchState().isRunning ? 'stop' : 'start' });
        break;
      case 'r':
        event.preventDefault();
        this.onTimerAction({ action: 'reset' });
        break;
      case 'l':
        if (this.timerService.stopwatchState().isRunning) {
          event.preventDefault();
          this.onTimerAction({ action: 'lap' });
        }
        break;
      case 'f':
        event.preventDefault();
        this.toggleFullscreen();
        break;
      case 'escape':
        if (this.isFullscreen) {
          event.preventDefault();
          this.exitFullscreen();
        }
        break;
    }
  };

  private handleFullscreenChange = (): void => {
    this.isFullscreen = typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  };

  private saveToHistory(): void {
    const state = this.timerService.stopwatchState();
    if (state.timeElapsed > 0) {
      this.storageService.addHistoryEntry({
        type: 'stopwatch',
        duration: state.timeElapsed,
        completed: true,
        laps: state.laps
      });
    }
  }

  trackByLapNumber(index: number, lap: any): number {
    return lap.lapNumber;
  }
}