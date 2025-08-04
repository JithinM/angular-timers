import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { TimerService } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { StorageService } from '../../core/services/storage.service';
import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { ControlButtonsComponent } from '../../shared/components/control-buttons/control-buttons.component';

@Component({
  selector: 'app-fullscreen-stopwatch',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    TimeDisplayComponent,
    ControlButtonsComponent
  ],
  template: `
    <div class="fullscreen-stopwatch-container" [class.hidden-controls]="hideControls()">
      <!-- Main Timer Display -->
      <div class="main-display">
        <app-time-display
          [time]="timerService.formattedStopwatchTime()"
          [status]="timerService.stopwatchStatus()"
          size="large"
          [animate]="true">
        </app-time-display>
      </div>

      <!-- Control Buttons -->
      <div class="control-buttons">
        <app-control-buttons
          [isRunning]="timerService.stopwatchState().isRunning"
          [showLap]="true"
          [showFullscreen]="false"
          [showSettings]="false"
          layout="horizontal"
          (action)="onTimerAction($event)">
        </app-control-buttons>
        
        <button 
          mat-icon-button 
          (click)="exitFullscreen()"
          class="exit-button"
          [attr.aria-label]="'Exit fullscreen'">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Lap Times Section -->
      <div class="laps-section" *ngIf="lapTimes.length > 0">
        <div class="laps-list">
          <div 
            *ngFor="let lap of lapTimes; trackBy: trackByLapNumber; let isLast = last"
            class="lap-item"
            [class.fastest]="lap.lapNumber === fastestLap"
            [class.slowest]="lap.lapNumber === slowestLap && lapTimes.length > 2"
          >
            <span class="lap-number">{{ lap.lapNumber }}</span>
            <span class="lap-time">{{ lap.lapTime }}</span>
            <span class="total-time">{{ lap.totalTime }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fullscreen-stopwatch-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      transition: background-color 0.3s ease;
    }

    .main-display {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
    }

    .control-buttons {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      padding: 2rem;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 16px;
      margin-bottom: 2rem;
      transition: opacity 0.3s ease;
    }

    .exit-button {
      position: absolute;
      top: 20px;
      right: 20px;
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .exit-button:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .laps-section {
      width: 100%;
      max-height: 30%;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.8);
    }

    .laps-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
    }

    .lap-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      font-family: 'Roboto Mono', monospace;
      font-size: 1.1rem;
    }

    .lap-number {
      color: #999;
      min-width: 40px;
    }

    .lap-time {
      font-weight: 600;
      color: #4fc3f7;
    }

    .total-time {
      color: #999;
      min-width: 100px;
      text-align: right;
    }

    .fastest .lap-time {
      color: #69f0ae;
      font-weight: 700;
    }

    .slowest .lap-time {
      color: #ff5252;
    }

    /* Hidden controls state */
    .fullscreen-stopwatch-container.hidden-controls {
      cursor: none;
    }

    .fullscreen-stopwatch-container.hidden-controls .control-buttons {
      opacity: 0;
      pointer-events: none;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .control-buttons {
        gap: 1rem;
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .lap-item {
        font-size: 0.9rem;
        padding: 0.25rem 0.5rem;
      }

      .total-time {
        min-width: 80px;
      }
    }

    @media (max-width: 480px) {
      .control-buttons {
        flex-wrap: wrap;
      }
    }
  `]
})
export class FullscreenStopwatchComponent implements OnInit, OnDestroy {
  hideControls = signal(false);
  lapTimes: any[] = [];
  fastestLap: number | null = null;
  slowestLap: number | null = null;

  private hideTimeout: any;
  private inactivityTimeout = 3000; // 3 seconds

  constructor(
    public timerService: TimerService,
    private audioService: AudioService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.enterFullscreen();
    this.setupInactivityDetection();
    this.updateLapTimes();
  }

  ngOnDestroy(): void {
    this.exitFullscreen();
    this.clearInactivityTimeout();
  }

  onTimerAction(event: { action: string }): void {
    this.audioService.playButtonClick();
    this.resetInactivityTimer();
    
    switch (event.action) {
      case 'start':
        this.timerService.startStopwatch();
        break;
      case 'stop':
        this.timerService.stopStopwatch();
        this.saveToHistory();
        break;
      case 'reset':
        this.timerService.resetStopwatch();
        this.updateLapTimes();
        break;
      case 'lap':
        this.timerService.addLap();
        this.audioService.playLapSound();
        this.updateLapTimes();
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

  private enterFullscreen(): void {
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  }

  exitFullscreen(): void {
    if (typeof document !== 'undefined' && document.exitFullscreen) {
      document.exitFullscreen();
    }
    
    // Navigate back to regular stopwatch
    if (typeof window !== 'undefined') {
      window.location.hash = '#/stopwatch';
      window.location.reload();
    }
  }

  private setupInactivityDetection(): void {
    if (typeof document === 'undefined') return;
    
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, () => this.resetInactivityTimer());
    });
    
    this.resetInactivityTimer();
  }

  private resetInactivityTimer(): void {
    this.hideControls.set(false);
    this.clearInactivityTimeout();
    
    this.hideTimeout = setTimeout(() => {
      this.hideControls.set(true);
    }, this.inactivityTimeout);
  }

  private clearInactivityTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

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