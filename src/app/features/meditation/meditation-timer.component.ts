import { Component, inject, signal, computed, effect, OnDestroy, EffectRef, HostListener, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { TimerService } from '../../core/services/timer.service';
import { AudioService } from '../../core/services/audio.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SeoService } from '../../core/services/seo.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-meditation-timer',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
    AdSlotComponent
  ],
  templateUrl: './meditation-timer.component.html',
  styleUrls: ['./meditation-timer.component.scss'],
  host: {
    '[class.fullscreen]': 'isFullscreen()'
  }
})
export class MeditationTimerComponent implements OnDestroy {
  private readonly timerService = inject(TimerService);
  private readonly audioService = inject(AudioService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly seoService = inject(SeoService);
  private readonly backgroundTimerService = inject(BackgroundTimerService);

  // Configuration signals
  readonly breatheInDuration = signal(4); // 4 seconds
  readonly breatheOutDuration = signal(6); // 6 seconds
  readonly totalCycles = signal(10); // 10 breath cycles
  readonly enableSound = signal(true);

  // State signals
  readonly currentPhase = signal<'in' | 'out' | 'hold'>('in');
  readonly currentCycle = signal(1);
  readonly timeRemaining = signal(0);
  readonly isRunning = signal(false);
  readonly isCompleted = signal(false);
  readonly isFullscreen = signal(false);
  
  // Computed values
  readonly progress = computed(() => {
    const totalTime = (this.breatheInDuration() + this.breatheOutDuration()) * 1000; // Convert to milliseconds
    const elapsed = totalTime - this.timeRemaining();
    return (elapsed / totalTime) * 100;
  });
  
  readonly phaseLabel = computed(() => {
    switch (this.currentPhase()) {
      case 'in': return 'Breathe In';
      case 'out': return 'Breathe Out';
      default: return 'Hold';
    }
  });
  
  private intervalId: number | null = null;
  private startTimestamp: number = 0;

  private effectRef!: EffectRef;

  private keyboardListener?: (event: KeyboardEvent) => void;

  constructor() {
    // Reset timer when durations change
    this.effectRef = effect(() => {
      this.breatheInDuration();
      this.breatheOutDuration();
      // Use untracked to prevent change detection issues
      untracked(() => this.resetTimer());
    }, { allowSignalWrites: true });

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Set initial SEO metadata
    this.seoService.updateTimerToolSeo('Meditation Timer');
  }

  ngOnDestroy(): void {
    if (this.effectRef) {
      this.effectRef.destroy();
    }
    this.pauseTimer();
    
    if (this.keyboardListener && typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keyboardListener);
    }
  }

  startTimer(): void {
    if (this.isRunning()) return;
    
    this.isRunning.set(true);
    this.isCompleted.set(false);
    this.currentPhase.set('in');
    this.timeRemaining.set(this.breatheInDuration() * 1000); // Convert seconds to milliseconds
    this.startTimestamp = Date.now();
    
    if (this.enableSound()) {
      this.audioService.playSound('success');
    }
    
    // Track timer start
    const totalDuration = (this.breatheInDuration() + this.breatheOutDuration()) * this.totalCycles();
    this.analyticsService.trackTimerStart('meditation-timer', totalDuration);
    
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
    
    this.intervalId = window.setInterval(() => this.updateTimer(), 10);
  }

  private updateTimer(): void {
    const elapsed = Date.now() - this.startTimestamp;
    const currentPhase = this.currentPhase();
    const inDuration = this.breatheInDuration() * 1000; // Convert seconds to milliseconds
    const outDuration = this.breatheOutDuration() * 1000; // Convert seconds to milliseconds
    const phaseDuration = currentPhase === 'in' ? inDuration : outDuration;
    
    const timeLeft = Math.max(0, phaseDuration - (elapsed % (inDuration + outDuration)));
    this.timeRemaining.set(timeLeft);
    
    // Check for phase transition
    const phaseElapsed = elapsed % (inDuration + outDuration);
    const newPhase = phaseElapsed < inDuration ? 'in' : 'out';
    
    if (newPhase !== currentPhase) {
      this.currentPhase.set(newPhase);
      if (this.enableSound()) {
        this.audioService.playSound('beep');
      }
    }
    
    // Check for completion
    const cyclesCompleted = Math.floor(elapsed / (inDuration + outDuration));
    if (cyclesCompleted >= this.totalCycles()) {
      this.completeTimer();
    } else if (cyclesCompleted + 1 > this.currentCycle()) {
      this.currentCycle.set(cyclesCompleted + 1);
    }
  }

  pauseTimer(): void {
    if (!this.isRunning()) return;
    
    this.isRunning.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Track timer pause
    const elapsedSeconds = Math.floor((Date.now() - this.startTimestamp) / 1000);
    this.analyticsService.trackTimerPause('meditation-timer', elapsedSeconds);
    
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
  }

  resetTimer(): void {
    this.pauseTimer();
    this.currentPhase.set('in');
    this.currentCycle.set(1);
    this.timeRemaining.set(this.breatheInDuration() * 1000); // Convert seconds to milliseconds
    this.isCompleted.set(false);
    
    // Track timer reset
    this.analyticsService.trackTimerReset('meditation-timer');
    
    // Save timer state for background persistence
    this.timerService.saveTimerStates();
  }

  private completeTimer(): void {
    this.pauseTimer();
    this.isCompleted.set(true);
    
    if (this.enableSound()) {
      this.audioService.playPattern('completion');
    }
    
    // Track timer completion
    const totalDuration = (this.breatheInDuration() + this.breatheOutDuration()) * this.totalCycles();
    this.analyticsService.trackTimerComplete('meditation-timer', totalDuration);
  }

  // Format time for display (MM:SS.ms)
  formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  // Fullscreen methods
  toggleFullscreen(): void {
    if (typeof document === 'undefined') return;

    if (!this.isFullscreen()) {
      document.documentElement.requestFullscreen?.();
      this.isFullscreen.set(true);
    } else {
      document.exitFullscreen?.();
      this.isFullscreen.set(false);
    }
  }

  exitFullscreen(): void {
    if (typeof document === 'undefined') return;
    
    if (this.isFullscreen()) {
      document.exitFullscreen?.();
      this.isFullscreen.set(false);
    }
  }

  // Keyboard shortcuts
  private setupKeyboardShortcuts(): void {
    if (typeof document === 'undefined') return;

    this.keyboardListener = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'KeyF':
          event.preventDefault();
          this.toggleFullscreen();
          break;
        case 'Escape':
          event.preventDefault();
          this.exitFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', this.keyboardListener);
  }
}