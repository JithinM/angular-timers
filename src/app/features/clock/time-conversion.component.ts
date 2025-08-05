import { Component, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SeoService } from '../../core/services/seo.service';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-time-conversion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatTabsModule,
    MatTooltipModule,
    AdSlotComponent
  ],
  template: `
    <div class="time-conversion-container">
      <!-- Top Ad Slot -->
      <section class="ad-section top-ad">
        <app-ad-slot
          size="leaderboard"
          position="top"
          [showPlaceholder]="true">
        </app-ad-slot>
      </section>
      
      <mat-card class="conversion-card">
        <mat-card-header>
          <mat-card-title>Time Conversion Tool</mat-card-title>
          <mat-card-subtitle>Convert between UTC and Unix timestamps with timezone conversion</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="conversion-content">
            <!-- UTC Input -->
            <div class="input-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>UTC Date & Time</mat-label>
                <input matInput type="datetime-local" [(ngModel)]="utcInput" (ngModelChange)="convertUtcToUnix()">
              </mat-form-field>
              <button mat-icon-button (click)="setCurrentUtc()" matTooltip="Set to current time">
                <mat-icon>access_time</mat-icon>
              </button>
            </div>
            
            <!-- Unix Input -->
            <div class="input-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Unix Timestamp (seconds)</mat-label>
                <input matInput type="number" [(ngModel)]="unixInput" (ngModelChange)="convertUnixToUtc()">
              </mat-form-field>
              <button mat-icon-button (click)="setCurrentUnix()" matTooltip="Set to current time">
                <mat-icon>access_time</mat-icon>
              </button>
            </div>
            
            <!-- Results -->
            <div class="result-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Unix Timestamp (milliseconds)</mat-label>
                <input matInput type="text" [value]="unixResultMilliseconds()" readonly>
              </mat-form-field>
              <button mat-icon-button (click)="copyToClipboard(unixResultMilliseconds())" matTooltip="Copy to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
            
            <div class="result-group">
              <mat-form-field appearance="fill" class="full-width">
                <mat-label>Local Date & Time</mat-label>
                <input matInput type="text" [value]="localResult()" readonly>
              </mat-form-field>
              <button mat-icon-button (click)="copyToClipboard(localResult())" matTooltip="Copy to clipboard">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
            
            <!-- Timezone Conversion Section -->
            <div class="timezone-section">
              <h3>Convert to Timezone</h3>
              <div class="input-group">
                <mat-form-field appearance="fill" class="full-width">
                  <mat-label>Select Timezone</mat-label>
                  <mat-select [(ngModel)]="selectedTimezone" (ngModelChange)="onTimezoneChange()">
                    <mat-option *ngFor="let tz of availableTimezones" [value]="tz.timezone">
                      {{ tz.name }} ({{ tz.timezone }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              
              <div class="result-group">
                <mat-form-field appearance="fill" class="full-width">
                  <mat-label>Time in Selected Timezone</mat-label>
                  <input matInput type="text" [value]="timezoneResult()" readonly>
                </mat-form-field>
                <button mat-icon-button (click)="copyToClipboard(timezoneResult())" matTooltip="Copy to clipboard">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
      
      <!-- Information Card -->
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>About Time Formats</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ul>
            <li><strong>UTC</strong> - Coordinated Universal Time, the primary time standard by which the world regulates clocks</li>
            <li><strong>Unix Timestamp</strong> - Number of seconds (or milliseconds) since January 1, 1970 00:00:00 UTC</li>
            <li><strong>Local Time</strong> - Time in your current timezone</li>
            <li><strong>Timezone Conversion</strong> - Convert UTC time to any selected timezone</li>
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
    .time-conversion-container {
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
    
    .conversion-card, .info-card {
      width: 100%;
      margin-bottom: 20px;
    }
    
    .tab-content {
      padding: 20px 0;
    }
    
    .input-group, .result-group {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .input-group mat-form-field, .result-group mat-form-field {
      flex: 1;
      margin-right: 10px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .info-card ul {
      padding-left: 20px;
    }
    
    .info-card li {
      margin-bottom: 10px;
    }
    
    .timezone-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    
    .timezone-section h3 {
      margin-top: 0;
      margin-bottom: 15px;
    }
    
    @media (max-width: 768px) {
      .input-group, .result-group {
        flex-direction: column;
        align-items: stretch;
      }
      
      .input-group mat-form-field, .result-group mat-form-field {
        margin-right: 0;
        margin-bottom: 10px;
      }
    }
  `]
})
export class TimeConversionComponent {
  private readonly seoService = inject(SeoService);
  
  // UTC to Unix conversion signals
  readonly utcInput = signal<string>('');
  readonly unixResultSeconds = signal<string>('');
  readonly unixResultMilliseconds = signal<string>('');
  
  // Unix to UTC conversion signals
  readonly unixInput = signal<number | null>(null);
  readonly utcResult = signal<string>('');
  readonly localResult = signal<string>('');
  
  // Timezone conversion signals
  readonly timezoneInput = signal<string>('');
  readonly timezoneResult = signal<string>('');
  readonly selectedTimezone = signal<string>('America/New_York');
  
  // Available timezones
  readonly availableTimezones = [
    // North America
    { id: 'america-new-york', name: 'New York', timezone: 'America/New_York' },
    { id: 'america-los-angeles', name: 'Los Angeles', timezone: 'America/Los_Angeles' },
    { id: 'america-chicago', name: 'Chicago', timezone: 'America/Chicago' },
    { id: 'america-denver', name: 'Denver', timezone: 'America/Denver' },
    { id: 'america-toronto', name: 'Toronto', timezone: 'America/Toronto' },
    { id: 'america-vancouver', name: 'Vancouver', timezone: 'America/Vancouver' },
    { id: 'america-mexico-city', name: 'Mexico City', timezone: 'America/Mexico_City' },
    { id: 'america-phoenix', name: 'Phoenix', timezone: 'America/Phoenix' },
    
    // South America
    { id: 'america-sao-paulo', name: 'São Paulo', timezone: 'America/Sao_Paulo' },
    { id: 'america-buenos-aires', name: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires' },
    { id: 'america-lima', name: 'Lima', timezone: 'America/Lima' },
    { id: 'america-bogota', name: 'Bogota', timezone: 'America/Bogota' },
    
    // Europe
    { id: 'europe-london', name: 'London', timezone: 'Europe/London' },
    { id: 'europe-paris', name: 'Paris', timezone: 'Europe/Paris' },
    { id: 'europe-berlin', name: 'Berlin', timezone: 'Europe/Berlin' },
    { id: 'europe-moscow', name: 'Moscow', timezone: 'Europe/Moscow' },
    { id: 'europe-rome', name: 'Rome', timezone: 'Europe/Rome' },
    { id: 'europe-madrid', name: 'Madrid', timezone: 'Europe/Madrid' },
    { id: 'europe-amsterdam', name: 'Amsterdam', timezone: 'Europe/Amsterdam' },
    { id: 'europe-athens', name: 'Athens', timezone: 'Europe/Athens' },
    { id: 'europe-stockholm', name: 'Stockholm', timezone: 'Europe/Stockholm' },
    
    // Asia
    { id: 'asia-tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { id: 'asia-shanghai', name: 'Shanghai', timezone: 'Asia/Shanghai' },
    { id: 'asia-dubai', name: 'Dubai', timezone: 'Asia/Dubai' },
    { id: 'asia-singapore', name: 'Singapore', timezone: 'Asia/Singapore' },
    { id: 'asia-hong-kong', name: 'Hong Kong', timezone: 'Asia/Hong_Kong' },
    { id: 'asia-bangkok', name: 'Bangkok', timezone: 'Asia/Bangkok' },
    { id: 'asia-seoul', name: 'Seoul', timezone: 'Asia/Seoul' },
    { id: 'asia-kolkata', name: 'Kolkata', timezone: 'Asia/Kolkata' },
    { id: 'asia-jakarta', name: 'Jakarta', timezone: 'Asia/Jakarta' },
    
    // Australia/Oceania
    { id: 'australia-sydney', name: 'Sydney', timezone: 'Australia/Sydney' },
    { id: 'australia-melbourne', name: 'Melbourne', timezone: 'Australia/Melbourne' },
    { id: 'australia-perth', name: 'Perth', timezone: 'Australia/Perth' },
    { id: 'australia-brisbane', name: 'Brisbane', timezone: 'Australia/Brisbane' },
    { id: 'pacific-auckland', name: 'Auckland', timezone: 'Pacific/Auckland' },
    { id: 'pacific-fiji', name: 'Fiji', timezone: 'Pacific/Fiji' },
    
    // Africa
    { id: 'africa-cape-town', name: 'Cape Town', timezone: 'Africa/Johannesburg' },
    { id: 'africa-lagos', name: 'Lagos', timezone: 'Africa/Lagos' },
    { id: 'africa-cairo', name: 'Cairo', timezone: 'Africa/Cairo' },
    { id: 'africa-nairobi', name: 'Nairobi', timezone: 'Africa/Nairobi' }
  ];
  
  constructor() {
    // Set initial values to current time
    this.setCurrentUtc();
    
    // Set SEO metadata
    this.seoService.updateTimerToolSeo('Time Conversion Tool', 'UTC Unix Timestamp Timezone');
  }
  
  // UTC to Unix conversion methods
  convertUtcToUnix(): void {
    const utcValue = this.utcInput();
    if (!utcValue) {
      this.unixInput.set(null);
      this.unixResultSeconds.set('');
      this.unixResultMilliseconds.set('');
      this.utcResult.set('');
      this.localResult.set('');
      this.timezoneResult.set('');
      return;
    }
    
    try {
      // The datetime-local input returns a string in YYYY-MM-DDTHH:mm format
      // We need to treat it as UTC by appending seconds and Z
      const utcDate = new Date(utcValue + ':00Z');
      const timestampSeconds = Math.floor(utcDate.getTime() / 1000);
      const timestampMilliseconds = utcDate.getTime();
      
      // Update unix input if it's not already set to this value
      const currentUnixInput = this.unixInput();
      if (currentUnixInput !== timestampSeconds) {
        this.unixInput.set(timestampSeconds);
      }
      
      this.unixResultSeconds.set(timestampSeconds.toString());
      this.unixResultMilliseconds.set(timestampMilliseconds.toString());
      
      // Also update other results
      this.utcResult.set(utcDate.toISOString().slice(0, 19).replace('T', ' '));
      this.localResult.set(utcDate.toLocaleString());
      
      // Also update timezone conversion when UTC changes
      this.convertToTimezone();
    } catch (error) {
      this.unixResultSeconds.set('Invalid date');
      this.unixResultMilliseconds.set('Invalid date');
    }
  }
  
  // Unix to UTC conversion methods
  convertUnixToUtc(): void {
    const unixValue = this.unixInput();
    if (unixValue === null) {
      this.utcInput.set('');
      this.utcResult.set('');
      this.localResult.set('');
      this.timezoneResult.set('');
      this.unixResultSeconds.set('');
      this.unixResultMilliseconds.set('');
      return;
    }
    
    try {
      // Handle both seconds and milliseconds
      const timestamp = unixValue > 10000000000 ? unixValue : unixValue * 1000;
      const date = new Date(timestamp);
      
      this.utcResult.set(date.toISOString().slice(0, 19).replace('T', ' '));
      this.localResult.set(date.toLocaleString());
      
      // Also update other results
      this.unixResultSeconds.set(Math.floor(timestamp / 1000).toString());
      this.unixResultMilliseconds.set(timestamp.toString());
      
      // Update UTC input if it's not already set to this value
      const utcString = date.toISOString().slice(0, 16);
      const currentUtcInput = this.utcInput();
      if (currentUtcInput !== utcString) {
        this.utcInput.set(utcString);
      }
      
      // Also update timezone conversion when Unix changes
      this.convertToTimezone();
    } catch (error) {
      this.utcResult.set('Invalid timestamp');
      this.localResult.set('Invalid timestamp');
      this.timezoneResult.set('Invalid timestamp');
    }
  }
  
  // Timezone conversion method
  convertToTimezone(): void {
    const utcValue = this.utcInput();
    const unixValue = this.unixInput();
    const timezone = this.selectedTimezone();
    
    if (!utcValue && unixValue === null) {
      this.timezoneResult.set('');
      return;
    }
    
    try {
      let date: Date;
      
      if (utcValue) {
        // Use UTC input - need to parse it correctly
        // The datetime-local input returns a string in YYYY-MM-DDTHH:mm format
        // We need to treat it as UTC
        const utcDate = new Date(utcValue + ':00Z'); // Add seconds and Z to indicate UTC
        date = utcDate;
      } else if (unixValue !== null) {
        // Use Unix input
        const timestamp = unixValue > 10000000000 ? unixValue : unixValue * 1000;
        date = new Date(timestamp);
      } else {
        this.timezoneResult.set('');
        return;
      }
      
      // Convert to selected timezone
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      
      // Format the date according to the selected timezone
      const formatted = new Intl.DateTimeFormat('sv-SE', options).format(date); // sv-SE gives YYYY-MM-DD HH:mm:ss format
      this.timezoneResult.set(formatted);
    } catch (error) {
      console.error('Timezone conversion error:', error);
      this.timezoneResult.set('Invalid timezone conversion');
    }
  }
  
  // Set current time methods
  setCurrentUtc(): void {
    const now = new Date();
    // Get UTC time string in YYYY-MM-DDTHH:mm format
    const utcString = now.toISOString().slice(0, 16);
    this.utcInput.set(utcString);
    this.convertUtcToUnix();
  }
  
  setCurrentUnix(): void {
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    this.unixInput.set(timestamp);
    this.convertUnixToUtc();
  }
  
  // Copy to clipboard method
  copyToClipboard(text: string): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  }
  
  // Timezone selection change
  onTimezoneChange(): void {
    this.convertToTimezone();
  }
}