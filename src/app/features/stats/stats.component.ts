import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';

import { StorageService, TimerHistoryEntry } from '../../core/services/storage.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

interface TimerStats {
  totalSessions: number;
  totalTimeSpent: number;
  favoriteTimerType: string;
  averageSessionLength: number;
  streak: number;
  lastUsed: Date;
}

interface TimerTypeStats {
  type: string;
  count: number;
  totalTime: number;
  averageDuration: number;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule,
    AdSlotComponent
  ],
  template: `
    <div class="stats-container">
      <!-- Top Ad Banner -->
      <app-ad-slot
        size="banner"
        position="top"
        [showPlaceholder]="true"
        class="no-print">
      </app-ad-slot>
      
      <!-- Header -->
      <header class="stats-header">
        <h1>
          <mat-icon>bar_chart</mat-icon>
          Your Timer Statistics
        </h1>
        <p>Track your timing habits and productivity</p>
      </header>

      <!-- Overview Cards -->
      <section class="overview-section">
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon color="primary">timer</mat-icon>
                <h3>Total Sessions</h3>
              </div>
              <div class="stat-value">{{ stats().totalSessions }}</div>
              <div class="stat-description">Timing sessions completed</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon color="primary">schedule</mat-icon>
                <h3>Total Time</h3>
              </div>
              <div class="stat-value">{{ formatDuration(stats().totalTimeSpent) }}</div>
              <div class="stat-description">Time spent timing</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon color="primary">local_fire_department</mat-icon>
                <h3>Current Streak</h3>
              </div>
              <div class="stat-value">{{ stats().streak }} days</div>
              <div class="stat-description">Consecutive days of use</div>
            </mat-card-content>
          </mat-card>

          <mat-card class="stat-card">
            <mat-card-content>
              <div class="stat-header">
                <mat-icon color="primary">favorite</mat-icon>
                <h3>Favorite Timer</h3>
              </div>
              <div class="stat-value">{{ stats().favoriteTimerType | titlecase }}</div>
              <div class="stat-description">Most used timer type</div>
            </mat-card-content>
          </mat-card>
        </div>
      </section>

      <!-- Timer Type Breakdown -->
      <section class="breakdown-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>pie_chart</mat-icon>
              Timer Usage Breakdown
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="breakdown-list">
              <div 
                *ngFor="let timerStat of timerTypeStats()" 
                class="breakdown-item"
              >
                <div class="breakdown-info">
                  <mat-icon>{{ getTimerIcon(timerStat.type) }}</mat-icon>
                  <div class="breakdown-text">
                    <span class="breakdown-type">{{ timerStat.type | titlecase }}</span>
                    <span class="breakdown-count">{{ timerStat.count }} sessions</span>
                  </div>
                </div>
                <div class="breakdown-stats">
                  <span class="breakdown-duration">{{ formatDuration(timerStat.totalTime) }}</span>
                  <span class="breakdown-average">Avg: {{ formatDuration(timerStat.averageDuration) }}</span>
                </div>
                <mat-progress-bar 
                  mode="determinate" 
                  [value]="(timerStat.count / maxTimerCount() * 100)"
                  class="breakdown-progress">
                </mat-progress-bar>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Recent Activity -->
      <section class="recent-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>history</mat-icon>
              Recent Activity
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="recent-list">
              <div 
                *ngFor="let entry of recentHistory()" 
                class="recent-item"
              >
                <div class="recent-info">
                  <mat-icon>{{ getTimerIcon(entry.type) }}</mat-icon>
                  <div class="recent-text">
                    <span class="recent-type">{{ entry.type | titlecase }}</span>
                    <span class="recent-duration">{{ formatDuration(entry.duration) }}</span>
                  </div>
                </div>
                <div class="recent-time">
                  {{ formatRelativeTime(entry.timestamp) }}
                </div>
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
    .stats-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .stats-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .stats-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .stats-header p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .overview-section {
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

    .stat-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .stat-header mat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
    }

    .stat-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 300;
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }

    .stat-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    mat-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
    }

    mat-card-header {
      margin-bottom: 1rem;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .breakdown-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .breakdown-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .breakdown-info mat-icon {
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .breakdown-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .breakdown-type {
      font-weight: 500;
      color: var(--text-primary);
    }

    .breakdown-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .breakdown-stats {
      display: flex;
      justify-content: space-between;
      margin-top: 0.25rem;
    }

    .breakdown-duration {
      font-weight: 500;
      color: var(--text-primary);
    }

    .breakdown-average {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .breakdown-progress {
      margin-top: 0.5rem;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .recent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.02);
      transition: background 0.2s ease;
    }

    .recent-item:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .recent-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .recent-info mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .recent-text {
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
      font-size: 0.875rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .stats-header h1 {
        font-size: 2rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .stat-value {
        font-size: 1.5rem;
      }

      .recent-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .recent-time {
        align-self: flex-end;
      }
    }

    @media (max-width: 480px) {
      .stats-container {
        padding: 0.75rem;
      }

      .stats-header h1 {
        font-size: 1.75rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatsComponent implements OnInit {
  private storageService = inject(StorageService);

  stats = signal<TimerStats>({
    totalSessions: 0,
    totalTimeSpent: 0,
    favoriteTimerType: 'stopwatch',
    averageSessionLength: 0,
    streak: 0,
    lastUsed: new Date()
  });

  timerTypeStats = signal<TimerTypeStats[]>([]);
  recentHistory = signal<TimerHistoryEntry[]>([]);
  maxTimerCount = signal(0);

  ngOnInit(): void {
    this.loadStats();
    this.loadTimerTypeStats();
    this.loadRecentHistory();
  }

  private loadStats(): void {
    const stats = this.storageService.stats();
    this.stats.set({
      totalSessions: stats.totalSessions,
      totalTimeSpent: stats.totalTimeSpent,
      favoriteTimerType: stats.favoriteTimerType,
      averageSessionLength: stats.averageSessionLength,
      streak: stats.streak,
      lastUsed: stats.lastUsed
    });
  }

  private loadTimerTypeStats(): void {
    const history = this.storageService.history();
    const typeStats: Record<string, TimerTypeStats> = {};

    // Calculate stats for each timer type
    history.forEach(entry => {
      if (!typeStats[entry.type]) {
        typeStats[entry.type] = {
          type: entry.type,
          count: 0,
          totalTime: 0,
          averageDuration: 0
        };
      }
      
      typeStats[entry.type].count++;
      typeStats[entry.type].totalTime += entry.duration;
    });

    // Calculate averages
    Object.values(typeStats).forEach(stat => {
      stat.averageDuration = stat.totalTime / stat.count;
    });

    const statsArray = Object.values(typeStats);
    this.timerTypeStats.set(statsArray);
    
    // Find max count for progress bar scaling
    const maxCount = Math.max(...statsArray.map(stat => stat.count), 1);
    this.maxTimerCount.set(maxCount);
  }

  private loadRecentHistory(): void {
    this.recentHistory.set(this.storageService.getRecentHistory(10));
  }

  getTimerIcon(type: string): string {
    switch (type) {
      case 'stopwatch': return 'timer';
      case 'countdown': return 'hourglass_empty';
      case 'interval': return 'fitness_center';
      default: return 'timer';
    }
  }

  formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
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
}