import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SeoService } from '../../core/services/seo.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-days-between',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    MatTooltipModule,
    AdSlotComponent
  ],
  template: `
    <div class="days-between-container">
      <!-- Top Ad Slot -->
      <section class="ad-section top-ad">
        <app-ad-slot
          size="leaderboard"
          position="top"
          [showPlaceholder]="true">
        </app-ad-slot>
      </section>
      
      <mat-card class="days-between-card">
        <mat-card-header>
          <mat-card-title>Days Between Dates Calculator</mat-card-title>
          <mat-card-subtitle>Calculate the number of days between two dates with optional exclusions</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="calculator-content">
            <div class="input-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Start Date</mat-label>
                <input matInput type="date" [(ngModel)]="startDate" (ngModelChange)="calculateDaysBetween()">
              </mat-form-field>
              <button mat-icon-button (click)="setStartDateToToday()" matTooltip="Set to today">
                <mat-icon>today</mat-icon>
              </button>
            </div>
            
            <div class="input-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>End Date</mat-label>
                <input matInput type="date" [(ngModel)]="endDate" (ngModelChange)="calculateDaysBetween()">
              </mat-form-field>
              <button mat-icon-button (click)="setEndDateToToday()" matTooltip="Set to today">
                <mat-icon>today</mat-icon>
              </button>
            </div>
            
            <div class="options-group">
              <mat-checkbox [(ngModel)]="excludeWeekends" (ngModelChange)="calculateDaysBetween()">
                Exclude weekends (Sat, Sun)
              </mat-checkbox>
              <mat-checkbox [(ngModel)]="excludeHolidays" (ngModelChange)="calculateDaysBetween()">
                Exclude USA holidays
              </mat-checkbox>
            </div>
            
            <div class="result-group">
              <mat-card class="result-card">
                <mat-card-content>
                  <div class="result-item">
                    <span class="result-label">Total Days:</span>
                    <span class="result-value">{{ daysBetween() }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Weeks:</span>
                    <span class="result-value">{{ weeksBetween() }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Months:</span>
                    <span class="result-value">{{ monthsBetween() }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Years:</span>
                    <span class="result-value">{{ yearsBetween() }}</span>
                  </div>
                  <div class="result-item">
                    <span class="result-label">Formatted:</span>
                    <span class="result-value">{{ formattedDuration() }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Information Card -->
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>About Date Calculations</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ul>
            <li><strong>Days Between Dates</strong> - Calculate the exact number of days between any two dates</li>
            <li><strong>Exclude Weekends</strong> - Remove Saturdays and Sundays from the count for business days</li>
            <li><strong>Exclude USA Holidays</strong> - Remove common USA holidays from the count</li>
            <li><strong>Multiple Formats</strong> - View results as days, weeks, months, years, or formatted duration</li>
          </ul>
        </mat-card-content>
      </mat-card>
      
      <!-- Bottom Ad Slot -->
      <section class="ad-section bottom-ad">
        <app-ad-slot
          size="leaderboard"
          position="bottom"
          [showPlaceholder]="true">
        </app-ad-slot>
      </section>
    </div>
  `,
  styles: [`
    .days-between-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .ad-section {
      width: 100%;
      margin: 16px 0;
    }
    
    .days-between-card, .info-card {
      width: 100%;
      margin-bottom: 20px;
    }
    
    .input-group {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .input-group mat-form-field {
      flex: 1;
      margin-right: 10px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .options-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 15px 0;
    }
    
    .result-card {
      margin-top: 15px;
    }
    
    .result-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .result-label {
      font-weight: 500;
    }
    
    .result-value {
      font-weight: 600;
    }
    
    .info-card ul {
      padding-left: 20px;
    }
    
    .info-card li {
      margin-bottom: 10px;
    }
    
    @media (max-width: 768px) {
      .input-group {
        flex-direction: column;
        align-items: stretch;
      }
      
      .input-group mat-form-field {
        margin-right: 0;
        margin-bottom: 10px;
      }
    }
  `]
})
export class DaysBetweenComponent {
  private readonly seoService = inject(SeoService);
  
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly excludeWeekends = signal<boolean>(false);
  readonly excludeHolidays = signal<boolean>(false);
  readonly daysBetween = signal<number>(0);
  readonly weeksBetween = signal<number>(0);
  readonly monthsBetween = signal<number>(0);
  readonly yearsBetween = signal<number>(0);
  readonly formattedDuration = signal<string>('');
  
  // USA Holidays (simplified list for common holidays)
  readonly usaHolidays = [
    // New Year's Day
    '01-01',
    // Martin Luther King Jr. Day (3rd Monday in January)
    // Presidents' Day (3rd Monday in February)
    // Memorial Day (Last Monday in May)
    '07-04', // Independence Day
    // Labor Day (1st Monday in September)
    // Columbus Day (2nd Monday in October)
    '11-11', // Veterans Day
    '11-28', // Thanksgiving (approximate, 4th Thursday)
    '12-25'  // Christmas Day
  ];
  
  constructor() {
    // Set initial values to current time
    this.setStartDateToToday();
    this.setEndDateToToday();
    
    // Set SEO metadata
    this.seoService.updateTimerToolSeo('Days Between Dates Calculator', 'Date Duration Calculator');
  }
  
  setStartDateToToday(): void {
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    this.startDate.set(todayString);
    this.calculateDaysBetween();
  }
  
  setEndDateToToday(): void {
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);
    this.endDate.set(todayString);
    this.calculateDaysBetween();
  }
  
  calculateDaysBetween(): void {
    const startDateStr = this.startDate();
    const endDateStr = this.endDate();
    
    if (!startDateStr || !endDateStr) {
      this.resetDaysBetween();
      return;
    }
    
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      
      // Reset time part to compare only dates
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      // Calculate total days
      const timeDiff = end.getTime() - start.getTime();
      let days = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Handle negative days
      if (days < 0) {
        days = 0;
      }
      
      // Exclude weekends if requested
      if (this.excludeWeekends()) {
        days = this.excludeWeekendsFromCount(start, end, days);
      }
      
      // Exclude holidays if requested
      if (this.excludeHolidays()) {
        days = this.excludeHolidaysFromCount(start, end, days);
      }
      
      this.daysBetween.set(days);
      this.weeksBetween.set(Math.floor(days / 7));
      this.monthsBetween.set(Math.floor(days / 30.44)); // Average days in a month
      this.yearsBetween.set(Math.floor(days / 365.25)); // Average days in a year
      
      // Format duration
      this.formattedDuration.set(this.formatDuration(days));
    } catch (error) {
      this.resetDaysBetween();
    }
  }
  
  private excludeWeekendsFromCount(start: Date, end: Date, totalDays: number): number {
    let weekdays = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return weekdays;
  }
  
  private excludeHolidaysFromCount(start: Date, end: Date, totalDays: number): number {
    let nonHolidays = totalDays;
    const current = new Date(start);
    
    while (current <= end) {
      const month = (current.getMonth() + 1).toString().padStart(2, '0');
      const day = current.getDate().toString().padStart(2, '0');
      const mmdd = `${month}-${day}`;
      
      if (this.usaHolidays.includes(mmdd)) {
        nonHolidays--;
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    return Math.max(0, nonHolidays);
  }
  
  private formatDuration(days: number): string {
    if (days === 0) return '0 days';
    
    const years = Math.floor(days / 365.25);
    const remainingDays = days % 365.25;
    const months = Math.floor(remainingDays / 30.44);
    const weeks = Math.floor(remainingDays / 7);
    const remainingDaysAfterWeeks = remainingDays % 7;
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    if (weeks > 0) parts.push(`${weeks} week${weeks !== 1 ? 's' : ''}`);
    if (remainingDaysAfterWeeks > 0) parts.push(`${remainingDaysAfterWeeks} day${remainingDaysAfterWeeks !== 1 ? 's' : ''}`);
    
    return parts.join(', ') || '0 days';
  }
  
  private resetDaysBetween(): void {
    this.daysBetween.set(0);
    this.weeksBetween.set(0);
    this.monthsBetween.set(0);
    this.yearsBetween.set(0);
    this.formattedDuration.set('0 days');
  }
}