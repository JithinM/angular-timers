import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';

import { AudioService } from '../../../core/services/audio.service';
import { TimeDisplayComponent } from '../../../shared/components/time-display/time-display.component';
import { AdSlotComponent } from '../../../shared/components/ad-slot/ad-slot.component';

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
    MatListModule,
    TimeDisplayComponent,
    AdSlotComponent
  ],
  template: `
    <div class="presentation-timer-container">
      <!-- Header -->
      <header class="presentation-header">
        <h1>
          <mat-icon>presentation_chart</mat-icon>
          Presentation Timer
        </h1>
        <p>Keep your presentations on track with timed segments</p>
      </header>

      <!-- Timer Visualizer -->
      <section class="timer-visualizer">
        <div class="timer-container">
          <div class="timer-display">
            <app-time-display
              [time]="formattedTime()"
              [status]="timerStatus()"
              size="large"
              [animate]="isRunning()">
            </app-time-display>
            
            <div class="current-segment" *ngIf="currentSegment()">
              <span class="segment-title">{{ currentSegment()!.title }}</span>
              <span class="segment-time">{{ formatDuration(currentSegment()!.duration) }}</span>
            </div>
          </div>
          
          <div class="progress-container">
            <mat-progress-bar 
              mode="determinate" 
              [value]="segmentProgress()"
              class="segment-progress">
            </mat-progress-bar>
            
            <div class="overall-progress">
              <span>Overall Progress: {{ overallProgress() }}%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Timer Controls -->
      <section class="timer-section">
        <mat-card class="timer-card">
          <mat-card-content>
            <div class="timer-controls">
              <button 
                mat-raised-button 
                color="primary"
                (click)="startTimer()"
                [disabled]="isRunning() || isPresentationComplete()"
                *ngIf="!isPresentationComplete()">
                <mat-icon>play_arrow</mat-icon>
                Start Presentation
              </button>
              
              <button 
                mat-raised-button 
                color="accent"
                (click)="pauseTimer()"
                *ngIf="isRunning()">
                <mat-icon>pause</mat-icon>
                Pause
              </button>
              
              <button 
                mat-raised-button 
                color="warn"
                (click)="resetTimer()"
                *ngIf="isRunning() || isPresentationComplete() || timeRemaining() < currentSegmentDuration()">
                <mat-icon>replay</mat-icon>
                Reset
              </button>
              
              <button 
                mat-raised-button 
                color="primary"
                (click)="nextSegment()"
                *ngIf="isSegmentComplete() && !isPresentationComplete()">
                <mat-icon>skip_next</mat-icon>
                Next Segment
              </button>
              
              <button 
                mat-raised-button 
                color="warn"
                (click)="finishPresentation()"
                *ngIf="isPresentationComplete()">
                <mat-icon>flag</mat-icon>
                Finish Presentation
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Segment Setup -->
      <section class="segment-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>timeline</mat-icon>
              Presentation Segments
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="segment-setup">
              <div class="segment-form">
                <mat-form-field appearance="fill">
                  <mat-label>Segment Title</mat-label>
                  <input 
                    matInput 
                    [(ngModel)]="newSegmentTitle" 
                    placeholder="Introduction"
                    [disabled]="isRunning()">
                </mat-form-field>
                
                <mat-form-field appearance="fill">
                  <mat-label>Duration (minutes)</mat-label>
                  <input 
                    matInput 
                    type="number" 
                    [(ngModel)]="newSegmentDuration" 
                    min="1" 
                    max="120"
                    [disabled]="isRunning()">
                </mat-form-field>
                
                <button 
                  mat-raised-button 
                  (click)="addSegment()"
                  [disabled]="isRunning() || !newSegmentTitle || newSegmentDuration <= 0">
                  Add Segment
                </button>
              </div>
              
              <div class="segments-list">
                <mat-list>
                  <mat-list-item 
                    *ngFor="let segment of segments(); let i = index; let first = first; let last = last"
                    class="segment-item"
                    [class.active]="currentSegmentIndex() === i"
                    [class.completed]="segment.completed">
                    <div class="segment-content">
                      <span class="segment-number">{{ i + 1 }}.</span>
                      <span class="segment-title">{{ segment.title }}</span>
                      <span class="segment-duration">{{ formatDuration(segment.duration) }}</span>
                      <button 
                        mat-icon-button 
                        (click)="removeSegment(i)"
                        [disabled]="isRunning()"
                        *ngIf="!segment.completed">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </mat-list-item>
                </mat-list>
              </div>
              
              <div class="segment-actions">
                <button 
                  mat-stroked-button 
                  (click)="clearSegments()"
                  [disabled]="isRunning() || segments().length === 0">
                  Clear All
                </button>
                
                <button 
                  mat-stroked-button 
                  (click)="loadSampleSegments()"
                  [disabled]="isRunning()">
                  Load Sample
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
              </section>
              
              <!-- Ad Slot -->
              <section class="ad-section">
                <app-ad-slot
                  size="rectangle"
                  position="inline"
                  [showPlaceholder]="true"
                  class="inline-ad">
                </app-ad-slot>
              </section>
              
              <!-- Presentation Tips -->
              <section class="tips-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>tips_and_updates</mat-icon>
              Presentation Tips
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <ul class="tips-list">
              <li>Practice your presentation with the timer to stay on track</li>
              <li>Leave 2-3 minutes at the end for questions</li>
              <li>Use visual cues when segments are about to end</li>
              <li>Keep a backup timer visible during your presentation</li>
              <li>Adjust segment times based on audience engagement</li>
            </ul>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
  styles: [`
    .presentation-timer-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #9c27b0 0%, #6a1b9a 100%);
      color: white;
    }

    .presentation-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .presentation-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: #e1bee7;
    }

    .presentation-header p {
      font-size: 1.125rem;
      color: #f3e5f5;
      margin: 0;
    }

    .timer-visualizer {
      display: flex;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .timer-container {
      width: 100%;
      max-width: 500px;
      text-align: center;
    }

    .timer-display {
      background: rgba(106, 27, 154, 0.8);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 1rem;
      border: 3px solid #e1bee7;
    }

    .current-segment {
      margin-top: 1rem;
      padding: 1rem;
      background: rgba(225, 190, 231, 0.2);
      border-radius: 10px;
    }

    .segment-title {
      display: block;
      font-size: 1.25rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .segment-time {
      font-size: 1rem;
      color: #ce93d8;
    }

    .progress-container {
      width: 100%;
    }

    .segment-progress {
      margin: 1rem 0;
      height: 12px;
      border-radius: 6px;
      background: #7b1fa2;
    }

    .overall-progress {
      text-align: center;
      font-size: 1rem;
      color: #ce93d8;
    }

    .timer-section {
      margin-bottom: 2rem;
    }

    .timer-card {
      background: #7b1fa2;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      padding: 1rem;
      text-align: center;
      border: 1px solid #9c27b0;
    }

    .timer-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }

    .timer-controls button {
      min-width: 140px;
    }

    .segment-section {
      margin-bottom: 2rem;
    }

    .segment-form {
      display: flex;
      gap: 1rem;
      align-items: end;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .segment-form mat-form-field {
      flex: 1;
      min-width: 120px;
    }

    .segment-item {
      background: rgba(225, 190, 231, 0.1);
      margin: 0.5rem 0;
      border-radius: 8px;
    }

    .segment-item.active {
      background: rgba(225, 190, 231, 0.3);
      border-left: 4px solid #e1bee7;
    }

    .segment-item.completed {
      opacity: 0.7;
    }

    .segment-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }

    .segment-number {
      font-weight: bold;
      min-width: 20px;
    }

    .segment-title {
      flex: 1;
    }

    .segment-duration {
      color: #ce93d8;
      min-width: 80px;
      text-align: right;
    }

    .segment-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1rem;
    }

    .tips-section ul {
      padding-left: 1.5rem;
    }

    .tips-section li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .presentation-header h1 {
        font-size: 2rem;
      }

      .segment-form {
        flex-direction: column;
      }

      .segment-form mat-form-field {
        width: 100%;
      }

      .timer-controls {
        flex-direction: column;
        align-items: center;
      }

      .timer-controls button {
        width: 100%;
        max-width: 200px;
      }

      .segment-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .segment-duration {
        text-align: left;
      }
    }

    @media (max-width: 480px) {
      .presentation-timer-container {
        padding: 0.75rem;
      }

      .timer-display {
        padding: 1rem;
      }
    }
  `]
})
export class PresentationTimerComponent implements OnInit {
  segments = signal<PresentationSegment[]>([]);
  currentSegmentIndex = signal(0);
  timeRemaining = signal(0);
  isRunning = signal(false);
  isPresentationComplete = signal(false);
  
  newSegmentTitle = '';
  newSegmentDuration = 5; // minutes
  
  private intervalId: any;

  audioService = inject(AudioService);
  snackBar = inject(MatSnackBar);

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
      return Math.min(((completedDuration + currentProgress) / totalDuration) * 100, 100);
    }
    
    return Math.min((completedDuration / totalDuration) * 100, 100);
  });

  isSegmentComplete = computed(() => {
    return this.timeRemaining() === 0 && this.currentSegmentDuration() > 0;
  });

  ngOnInit(): void {
    // Load sample segments for demonstration
    this.loadSampleSegments();
  }

  addSegment(): void {
    if (this.newSegmentTitle && this.newSegmentDuration > 0) {
      const segment: PresentationSegment = {
        id: Date.now().toString(),
        title: this.newSegmentTitle,
        duration: this.newSegmentDuration * 60, // convert minutes to seconds
        completed: false
      };
      
      this.segments.update(segments => [...segments, segment]);
      
      // Reset form
      this.newSegmentTitle = '';
      this.newSegmentDuration = 5;
    }
  }

  removeSegment(index: number): void {
    this.segments.update(segments => segments.filter((_, i) => i !== index));
    
    // Adjust current segment index if needed
    if (index < this.currentSegmentIndex()) {
      this.currentSegmentIndex.update(i => Math.max(0, i - 1));
    } else if (index === this.currentSegmentIndex() && this.segments().length > 0) {
      // If removing current segment, reset timer
      this.resetTimer();
    }
  }

  clearSegments(): void {
    this.segments.set([]);
    this.currentSegmentIndex.set(0);
    this.resetTimer();
  }

  loadSampleSegments(): void {
    this.segments.set([
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
    ]);
    
    this.currentSegmentIndex.set(0);
    this.resetTimer();
  }

  startTimer(): void {
    const segment = this.currentSegment();
    if (segment && this.timeRemaining() > 0) {
      this.isRunning.set(true);
      this.audioService.playSuccess();
      
      // Start countdown timer
      this.intervalId = setInterval(() => {
        const newTime = Math.max(0, this.timeRemaining() - 100);
        this.timeRemaining.set(newTime);
        
        // Play warning sounds at key intervals
        if (newTime <= 60000 && newTime > 59900) {
          this.audioService.playWarning();
        } else if (newTime <= 30000 && newTime > 29900) {
          this.audioService.playWarning();
        } else if (newTime <= 10000 && newTime > 9900) {
          this.audioService.playWarning();
        }
        
        if (newTime === 0) {
          this.endSegment();
        }
      }, 100);
    }
  }

  pauseTimer(): void {
    this.isRunning.set(false);
    this.audioService.playButtonClick();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  resetTimer(): void {
    this.isRunning.set(false);
    this.isPresentationComplete.set(false);
    
    const segment = this.currentSegment();
    if (segment) {
      this.timeRemaining.set(segment.duration * 1000);
    }
    
    this.audioService.playButtonClick();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  endSegment(): void {
    this.isRunning.set(false);
    this.audioService.playPattern('completion');
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Mark current segment as completed
    this.segments.update(segments => {
      const updated = [...segments];
      if (this.currentSegmentIndex() < updated.length) {
        updated[this.currentSegmentIndex()] = {
          ...updated[this.currentSegmentIndex()],
          completed: true
        };
      }
      return updated;
    });
    
    // Show segment end notification
    const segment = this.currentSegment();
    if (segment) {
      this.snackBar.open(`📋 "${segment.title}" completed!`, 'Next', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        this.nextSegment();
      });
    }
  }

  nextSegment(): void {
    const segments = this.segments();
    const currentIndex = this.currentSegmentIndex();
    
    if (currentIndex < segments.length - 1) {
      this.currentSegmentIndex.update(i => i + 1);
      this.resetTimer();
      const nextSegment = this.currentSegment();
      if (nextSegment) {
        this.snackBar.open(`📋 Starting "${nextSegment.title}"`, '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    } else {
      this.isPresentationComplete.set(true);
      this.snackBar.open('🎉 Presentation complete! Great job!', 'Finish', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  finishPresentation(): void {
    this.isRunning.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.snackBar.open('🏆 Presentation finished successfully!', 'Done', {
      duration: 10000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    }).onAction().subscribe(() => {
      this.resetPresentation();
    });
  }

  private resetPresentation(): void {
    this.isPresentationComplete.set(false);
    this.currentSegmentIndex.set(0);
    this.segments.update(segments => 
      segments.map(segment => ({ ...segment, completed: false }))
    );
    this.resetTimer();
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}