import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

import { TimeDisplayComponent } from '../../shared/components/time-display/time-display.component';
import { ControlButtonsComponent, TimerAction } from '../../shared/components/control-buttons/control-buttons.component';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';
import { TimerService } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { StorageService } from '../../core/services/storage.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';

interface LapData {
  lapNumber: number;
  time: number;
  totalTime: number;
  diff: number;
}

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
    MatSlideToggleModule,
    MatTooltipModule,
    FormsModule,
    TimeDisplayComponent,
    ControlButtonsComponent,
    AdSlotComponent
  ],
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.scss']
})
export class StopwatchComponent implements OnInit, OnDestroy {
  isFullscreen = false;
  lapTimes: any[] = [];
  
  // Signal for reactive state management
  readonly showMilliseconds = signal(true);

  // Computed signals for the new template
  readonly laps = computed(() => {
    const state = this.timerService.stopwatchState();
    const lapTimes = state.laps;
    const processedLaps: LapData[] = [];
    
    lapTimes.forEach((totalTime, index) => {
      const lapTime = index === 0 ? totalTime : totalTime - lapTimes[index - 1];
      const avgTime = processedLaps.length > 0
        ? processedLaps.reduce((sum, l) => sum + l.time, 0) / processedLaps.length
        : lapTime;
      
      processedLaps.push({
        lapNumber: index + 1,
        time: lapTime,
        totalTime: totalTime,
        diff: processedLaps.length > 0 ? lapTime - avgTime : 0
      });
    });
    
    return processedLaps;
  });

  readonly currentLapTime = computed(() => {
    const state = this.timerService.stopwatchState();
    const laps = this.laps();
    if (!state.isRunning || laps.length === 0) return 0;
    
    const lastLapTotal = laps[laps.length - 1]?.totalTime || 0;
    return state.timeElapsed - lastLapTotal;
  });

  readonly fastestLap = computed(() => {
    const laps = this.laps();
    if (laps.length === 0) return 0;
    return Math.min(...laps.map(lap => lap.time));
  });

  readonly slowestLap = computed(() => {
    const laps = this.laps();
    if (laps.length === 0) return 0;
    return Math.max(...laps.map(lap => lap.time));
  });

  readonly averageLap = computed(() => {
    const laps = this.laps();
    if (laps.length === 0) return 0;
    return laps.reduce((sum, lap) => sum + lap.time, 0) / laps.length;
  });


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

  toggleFullscreen(): void {
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

  // Format time for display
  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    
    if (this.showMilliseconds()) {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  // Helper method for template to access Math.abs
  getAbsoluteValue(value: number): number {
    return Math.abs(value);
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