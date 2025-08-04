import { Component, OnInit, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

import { StorageService, TimerHistoryEntry } from '../../core/services/storage.service';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: Date;
  progress?: number;
  target?: number;
}

@Component({
  selector: 'app-achievements',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  template: `
    <div class="achievements-container">
      <!-- Header -->
      <header class="achievements-header">
        <h1>
          <mat-icon>emoji_events</mat-icon>
          Your Achievements
        </h1>
        <p>Earn badges by using TimerTools consistently</p>
      </header>

      <!-- Achievement Stats -->
      <section class="stats-section">
        <div class="achievements-stats">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ unlockedCount() }}</div>
              <div class="stat-label">Achievements Unlocked</div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ totalAchievements() }}</div>
              <div class="stat-label">Total Achievements</div>
            </mat-card-content>
          </mat-card>
          
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-value">{{ unlockPercentage() }}%</div>
              <div class="stat-label">Completion</div>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- Achievements Grid -->
      <section class="achievements-section">
        <div class="achievements-grid">
          <mat-card 
            *ngFor="let achievement of achievements()" 
            class="achievement-card"
            [class.unlocked]="achievement.unlocked"
          >
            <mat-card-content>
              <div class="achievement-header">
                <mat-icon 
                  class="achievement-icon" 
                  [color]="achievement.unlocked ? 'primary' : 'disabled'">
                  {{ achievement.icon }}
                </mat-icon>
                <div class="achievement-info">
                  <h3 class="achievement-title">{{ achievement.title }}</h3>
                  <p class="achievement-description">{{ achievement.description }}</p>
                </div>
              </div>
              
              <div class="achievement-status" *ngIf="!achievement.unlocked && achievement.progress !== undefined">
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="achievement.progress"
                  class="achievement-progress">
                </mat-progress-bar>
                <div class="progress-text">
                  {{ achievement.progress | number:'1.0-0' }}% Complete
                </div>
              </div>
              
              <div class="achievement-unlocked" *ngIf="achievement.unlocked && achievement.unlockedDate">
                Unlocked on {{ formatDate(achievement.unlockedDate) }}
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .achievements-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .achievements-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .achievements-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .achievements-header p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .stats-section {
      margin-bottom: 2rem;
    }

    .achievements-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 300;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 1rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .achievement-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .achievement-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
    }

    .achievement-card.unlocked {
      border: 2px solid var(--primary-color);
    }

    .achievement-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .achievement-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
    }

    .achievement-info {
      flex: 1;
    }

    .achievement-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .achievement-description {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .achievement-status {
      margin-top: 1rem;
    }

    .achievement-progress {
      margin-bottom: 0.5rem;
    }

    .progress-text {
      font-size: 0.875rem;
      color: var(--text-secondary);
      text-align: center;
    }

    .achievement-unlocked {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      font-size: 0.875rem;
      color: var(--success-color);
      text-align: center;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .achievements-header h1 {
        font-size: 2rem;
      }

      .achievements-stats {
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }

      .stat-value {
        font-size: 2rem;
      }

      .achievements-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .achievements-container {
        padding: 0.75rem;
      }

      .achievements-header h1 {
        font-size: 1.75rem;
      }

      .achievements-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AchievementsComponent implements OnInit {
  private storageService = inject(StorageService);

  achievements = signal<Achievement[]>([]);
  unlockedCount = computed(() => this.achievements().filter(a => a.unlocked).length);
  totalAchievements = computed(() => this.achievements().length);
  unlockPercentage = computed(() => {
    const total = this.totalAchievements();
    return total > 0 ? Math.round((this.unlockedCount() / total) * 100) : 0;
  });

  ngOnInit(): void {
    this.loadAchievements();
  }

  private loadAchievements(): void {
    const history = this.storageService.history();
    const stats = this.storageService.stats();
    
    // Calculate achievements based on user activity
    const achievements: Achievement[] = [
      {
        id: 'first-timer',
        title: 'First Timer',
        description: 'Use any timer for the first time',
        icon: 'timer',
        unlocked: history.length > 0,
        unlockedDate: history.length > 0 ? history[0].timestamp : undefined
      },
      {
        id: 'stopwatch-master',
        title: 'Stopwatch Master',
        description: 'Use the stopwatch 10 times',
        icon: 'timer',
        unlocked: history.filter(h => h.type === 'stopwatch').length >= 10,
        progress: Math.min((history.filter(h => h.type === 'stopwatch').length / 10) * 100, 100),
        target: 10
      },
      {
        id: 'countdown-champion',
        title: 'Countdown Champion',
        description: 'Complete 5 countdown timers',
        icon: 'hourglass_empty',
        unlocked: history.filter(h => h.type === 'countdown' && h.completed).length >= 5,
        progress: Math.min((history.filter(h => h.type === 'countdown' && h.completed).length / 5) * 100, 100),
        target: 5
      },
      {
        id: 'interval-pro',
        title: 'Interval Pro',
        description: 'Complete 3 interval training sessions',
        icon: 'fitness_center',
        unlocked: history.filter(h => h.type === 'interval' && h.completed).length >= 3,
        progress: Math.min((history.filter(h => h.type === 'interval' && h.completed).length / 3) * 100, 100),
        target: 3
      },
      {
        id: 'time-warrior',
        title: 'Time Warrior',
        description: 'Spend over 1 hour using timers',
        icon: 'schedule',
        unlocked: stats.totalTimeSpent > 3600000, // 1 hour in ms
        progress: Math.min((stats.totalTimeSpent / 3600000) * 100, 100),
        target: 3600000
      },
      {
        id: 'consistent-user',
        title: 'Consistent User',
        description: 'Use TimerTools for 7 consecutive days',
        icon: 'calendar_today',
        unlocked: stats.streak >= 7,
        progress: Math.min((stats.streak / 7) * 100, 100),
        target: 7
      },
      {
        id: 'pomodoro-expert',
        title: 'Pomodoro Expert',
        description: 'Complete 10 Pomodoro sessions',
        icon: 'work',
        unlocked: false, // We don't track Pomodoro sessions in history yet
        progress: 0,
        target: 10
      },
      {
        id: 'marathon-user',
        title: 'Marathon User',
        description: 'Spend over 10 hours using timers',
        icon: 'all_inclusive',
        unlocked: stats.totalTimeSpent > 36000000, // 10 hours in ms
        progress: Math.min((stats.totalTimeSpent / 36000000) * 100, 100),
        target: 36000000
      }
    ];

    this.achievements.set(achievements);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}