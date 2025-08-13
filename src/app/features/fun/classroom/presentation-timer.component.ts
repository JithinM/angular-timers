import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatListModule } from '@angular/material/list';

import { AudioService } from '../../../core/services/audio.service';
import { TimeDisplayComponent } from '../../../shared/components/time-display/time-display.component';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { SeoService } from '../../../core/services/seo.service';
import { TimerService } from '../../../core/services/timer.service';
import { BackgroundTimerService } from '../../../core/services/background-timer.service';

interface PresentationSegment {
  id: string;
  title: string;
  duration: number; // in seconds
  completed: boolean;
}

@Component({
  selector: 'app-presentation-timer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatListModule,
    DragDropModule,
    TimeDisplayComponent,
    AdSlotComponent
  ],
  templateUrl: './presentation-timer.component.html',
  styleUrls: ['./presentation-timer.component.scss']
})
export class PresentationTimerComponent implements OnInit, OnDestroy {
  newSegmentTitle = '';
  newSegmentDuration = 5; // minutes
  editingSegmentIndex: number | null = null;
  editingTitle: string = '';
  editingDurationMinutes: number = 1;

  audioService = inject(AudioService);
  snackBar = inject(MatSnackBar);
  seoService = inject(SeoService);
  analyticsService = inject(AnalyticsService);
  timerService = inject(TimerService);
  backgroundTimerService = inject(BackgroundTimerService);

  // Use centralized state from TimerService
  presentationTimerState = this.timerService.presentationTimerState;
  
  segments = computed(() => this.presentationTimerState().segments);
  currentSegmentIndex = computed(() => this.presentationTimerState().currentSegmentIndex);
  timeRemaining = computed(() => this.presentationTimerState().timeRemaining);
  isRunning = computed(() => this.presentationTimerState().isRunning);
  isPresentationComplete = computed(() => this.presentationTimerState().isPresentationComplete);

  currentSegment = computed(() => {
    const segments = this.segments();
    const index = this.currentSegmentIndex();
    return index < segments.length ? segments[index] : null;
  });

  currentSegmentDuration = computed(() => {
    const segment = this.currentSegment();
    return segment ? segment.duration * 1000 : 0;
  });

  formattedTime = computed(() => {
    const totalSeconds = Math.ceil(this.timeRemaining() / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });

  timerStatus = computed(() => {
    if (this.isPresentationComplete()) return 'expired';
    if (this.isRunning()) return 'running';
    return 'stopped';
  });

  segmentProgress = computed(() => {
    const segment = this.currentSegment();
    if (!segment) return 0;
    
    const initial = segment.duration * 1000;
    const remaining = this.timeRemaining();
    if (initial === 0) return 0;
    return ((initial - remaining) / initial) * 100;
  });

  overallProgress = computed(() => {
    const segments = this.segments();
    if (segments.length === 0) return 0;
    
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);
    const completedDuration = segments
      .slice(0, this.currentSegmentIndex())
      .reduce((sum, seg) => sum + seg.duration, 0);
    
    const currentSegment = this.currentSegment();
    if (currentSegment) {
      const currentProgress = ((currentSegment.duration * 1000) - this.timeRemaining()) / 1000;
      return Number(Math.min(((completedDuration + currentProgress) / totalDuration) * 100, 100).toFixed(2));
    }
    
    return Number(Math.min((completedDuration / totalDuration) * 100, 100).toFixed(2));
  });

  isSegmentComplete = computed(() => {
    return this.timeRemaining() === 0 && this.currentSegmentDuration() > 0;
  });

  private lastCompletionTimestamp = 0;
  isFullscreen = false;
  private keyboardHandler = this.onKeyDown.bind(this);

  constructor() {
    // Effect to handle segment completion with intelligent duplicate prevention
    effect(() => {
      const segmentComplete = this.isSegmentComplete();
      const timeRemaining = this.timeRemaining();
      const currentTime = Date.now();
      
      // Only trigger completion if actually completed (time reached 0) and not a stale state
      if (segmentComplete && timeRemaining === 0 &&
          (currentTime - this.lastCompletionTimestamp) > 5000) {
        this.lastCompletionTimestamp = currentTime;
        this.onSegmentComplete();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.keyboardHandler);
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    // Only load sample segments if no segments exist
    if (this.segments().length === 0) {
      this.loadSampleSegments();
    }
    
    // Set initial SEO metadata
    this.seoService.updateTimerToolSeo('Presentation Timer', '30 Minute');
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keyboardHandler);
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    }
    this.exitFullscreen();
  }

  addSegment(): void {
    if (this.newSegmentTitle && this.newSegmentDuration > 0) {
      const segment: PresentationSegment = {
        id: Date.now().toString(),
        title: this.newSegmentTitle,
        duration: this.newSegmentDuration * 60, // convert minutes to seconds
        completed: false
      };
      
      const currentSegments = this.segments();
      const updatedSegments = [...currentSegments, segment];
      this.timerService.setupPresentationTimer(updatedSegments);
      this.timerService.saveTimerStates();
      
      // Update SEO metadata with total presentation time
      const totalMinutes = updatedSegments.reduce((sum: number, seg: PresentationSegment) => sum + seg.duration, 0) / 60;
      this.seoService.updateTimerToolSeo('Presentation Timer', `${Math.round(totalMinutes)} Minute`);
      
      // Reset form
      this.newSegmentTitle = '';
      this.newSegmentDuration = 5;
    }
  }

  removeSegment(index: number): void {
    const currentSegments = this.segments();
    const updatedSegments = currentSegments.filter((_, i) => i !== index);
    this.timerService.setupPresentationTimer(updatedSegments);
    this.timerService.saveTimerStates();
    
    // If removing current segment, reset timer
    if (index === this.currentSegmentIndex() && updatedSegments.length > 0) {
      this.resetTimer();
    }
  }

  // Drag and drop reordering
  onDrop(event: CdkDragDrop<PresentationSegment[]>): void {
    if (this.isRunning()) return;
    const currentSegments = [...this.segments()];
    moveItemInArray(currentSegments, event.previousIndex, event.currentIndex);
    this.timerService.setupPresentationTimer(currentSegments);
    this.timerService.saveTimerStates();
  }

  // Inline editing helpers
  private beginEdit(index: number): void {
    if (this.isRunning()) return;
    const seg = this.segments()[index];
    this.editingSegmentIndex = index;
    this.editingTitle = seg?.title ?? '';
    this.editingDurationMinutes = Math.max(1, Number((((seg?.duration ?? 60) / 60)).toFixed(2)));
  }

  // Start editing from title or duration interactions
  startEditTitle(index: number): void { this.beginEdit(index); }
  startEditDuration(index: number): void { this.beginEdit(index); }

  private commitEditSegment(index: number): void {
    if (this.editingSegmentIndex === null) return;
    const trimmedTitle = (this.editingTitle || '').trim();
    if (!trimmedTitle) { this.cancelEditTitle(); return; }
    const minutes = isNaN(this.editingDurationMinutes) ? 1 : Math.max(1, Number(this.editingDurationMinutes));
    const currentSegments = this.segments();
    const updatedSegments = currentSegments.map((seg, i) => i === index ? { ...seg, title: trimmedTitle, duration: Math.round(minutes * 60) } : seg);
    this.timerService.setupPresentationTimer(updatedSegments);
    this.timerService.saveTimerStates();
    this.cancelEditTitle();
  }

  commitEditTitle(index: number): void { this.commitEditSegment(index); }
  commitEditDuration(index: number): void { this.commitEditSegment(index); }

  cancelEditTitle(): void {
    this.editingSegmentIndex = null;
    this.editingTitle = '';
    this.editingDurationMinutes = 1;
  }

  clearSegments(): void {
    this.timerService.setupPresentationTimer([]);
    this.resetTimer();
    this.timerService.saveTimerStates();
    
    // Update SEO metadata
    this.seoService.updateTimerToolSeo('Presentation Timer', '0 Minute');
  }

  loadSampleSegments(): void {
    const sampleSegments: PresentationSegment[] = [
      {
        id: '1',
        title: 'Introduction',
        duration: 300, // 5 minutes
        completed: false
      },
      {
        id: '2',
        title: 'Main Content',
        duration: 600, // 10 minutes
        completed: false
      },
      {
        id: '3',
        title: 'Case Study',
        duration: 300, // 5 minutes
        completed: false
      },
      {
        id: '4',
        title: 'Q&A Session',
        duration: 600, // 10 minutes
        completed: false
      }
    ];
    
    this.timerService.setupPresentationTimer(sampleSegments);
    // Only reset timer if explicitly loading sample segments (not on navigation)
    if (this.segments().length === 0) {
      this.resetTimer();
    }
    this.timerService.saveTimerStates();
    
    // Update SEO metadata with total presentation time (30 minutes)
    this.seoService.updateTimerToolSeo('Presentation Timer', '30 Minute');
  }

  startTimer(): void {
    const segment = this.currentSegment();
    if (segment && this.timeRemaining() > 0) {
      this.timerService.startPresentationTimer();
      this.audioService.playSuccess();
      this.timerService.saveTimerStates();
      
      // Track timer start
      const durationSeconds = segment.duration;
      this.analyticsService.trackTimerStart('presentation-timer', durationSeconds);
    }
  }

  pauseTimer(): void {
    this.timerService.stopPresentationTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer pause
    const segment = this.currentSegment();
    if (segment) {
      const elapsedSeconds = segment.duration - Math.ceil(this.timeRemaining() / 1000);
      this.analyticsService.trackTimerPause('presentation-timer', elapsedSeconds);
    }
  }

  resetTimer(): void {
    this.timerService.resetPresentationTimer();
    this.audioService.playButtonClick();
    this.timerService.saveTimerStates();
    
    // Track timer reset
    this.analyticsService.trackTimerReset('presentation-timer');
  }

  private onSegmentComplete(): void {
    this.audioService.playPattern('completion');
    
    // Track segment completion
    const segment = this.currentSegment();
    if (segment) {
      this.analyticsService.trackTimerComplete('presentation-timer-segment-end', segment.duration);
      
      // Show segment end notification
      this.snackBar.open(`📋 "${segment.title}" completed!`, 'Next', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        this.nextSegment();
      });
    }
  }

  // Fullscreen methods
  toggleFullscreen(): void {
    if (this.isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  private enterFullscreen(): void {
    if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        if (('orientation' in screen) && (screen as any).orientation?.lock) {
          (screen as any).orientation.lock('landscape').catch(() => {});
        }
      }).catch(() => {});
    }
  }

  private exitFullscreen(): void {
    if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().finally(() => {
        if (('orientation' in screen) && (screen as any).orientation?.unlock) {
          try { (screen as any).orientation.unlock(); } catch (_) {}
        }
      });
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    switch (event.key.toLowerCase()) {
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
  }

  private handleFullscreenChange = (): void => {
    this.isFullscreen = typeof document !== 'undefined' ? !!document.fullscreenElement : false;
  };

  nextSegment(): void {
    const segments = this.segments();
    const currentIndex = this.currentSegmentIndex();
    
    if (currentIndex < segments.length - 1) {
      this.timerService.nextPresentationSegment();
      this.resetTimer();
      
      // Track next segment
      this.analyticsService.trackTimerStart('presentation-timer-next-segment', 0);
      
      const nextSegment = this.currentSegment();
      if (nextSegment) {
        this.snackBar.open(`📋 Starting "${nextSegment.title}"`, '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    } else {
      this.timerService.nextPresentationSegment();
      
      // Track presentation completion
      this.analyticsService.trackTimerComplete('presentation-timer-complete', 0);
      
      this.snackBar.open('🎉 Presentation complete! Great job!', 'Finish', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  finishPresentation(): void {
    this.timerService.stopPresentationTimer();
    
    // Track presentation finish
    this.analyticsService.trackTimerComplete('presentation-timer-finish', 0);
    
    this.snackBar.open('🏆 Presentation finished successfully!', 'Done', {
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.resetPresentation();
    });
  }

  private resetPresentation(): void {
    const segments = this.segments().map(segment => ({ ...segment, completed: false }));
    this.timerService.setupPresentationTimer(segments);
    this.resetTimer();
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}