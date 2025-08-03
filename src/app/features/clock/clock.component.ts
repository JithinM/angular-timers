import { Component, signal, computed, effect, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';

import { StorageService } from '../../core/services/storage.service';
import { BackgroundTimerService } from '../../core/services/background-timer.service';

interface TimeZoneInfo {
  id: string;
  name: string;
  timezone: string;
  country: string;
  city: string;
  offset: string;
  time: Date;
  displayTime: string;
  displayDate: string;
  isPrimary?: boolean;
}

interface ClockSettings {
  format24Hour: boolean;
  showSeconds: boolean;
  showDate: boolean;
  showTimezone: boolean;
  selectedTimezones: string[];
  primaryTimezone: string;
}

@Component({
  selector: 'app-clock',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatMenuModule,
    FormsModule
  ],
  templateUrl: './clock.component.html',
  styleUrl: './clock.component.scss'
})
export class ClockComponent implements OnDestroy {
  private readonly storageService = inject(StorageService);

  // Signals for reactive state management
  readonly currentTime = signal<Date>(new Date());
  readonly isFullscreen = signal(false);
  readonly showSettings = signal(false);

  // Settings signals
  readonly format24Hour = signal(false);
  readonly showSeconds = signal(true);
  readonly showDate = signal(true);
  readonly showTimezone = signal(true);
  readonly selectedTimezones = signal<string[]>(['America/New_York', 'Europe/London', 'Asia/Tokyo']);
  readonly primaryTimezone = signal('America/New_York');

  // Available timezones
  readonly availableTimezones: TimeZoneInfo[] = [
    // North America
    { id: 'america-new-york', name: 'New York', timezone: 'America/New_York', country: 'USA', city: 'New York', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'america-los-angeles', name: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA', city: 'Los Angeles', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'america-chicago', name: 'Chicago', timezone: 'America/Chicago', country: 'USA', city: 'Chicago', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'america-denver', name: 'Denver', timezone: 'America/Denver', country: 'USA', city: 'Denver', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'america-toronto', name: 'Toronto', timezone: 'America/Toronto', country: 'Canada', city: 'Toronto', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'america-vancouver', name: 'Vancouver', timezone: 'America/Vancouver', country: 'Canada', city: 'Vancouver', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    
    // Europe
    { id: 'europe-london', name: 'London', timezone: 'Europe/London', country: 'UK', city: 'London', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'europe-paris', name: 'Paris', timezone: 'Europe/Paris', country: 'France', city: 'Paris', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'europe-berlin', name: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany', city: 'Berlin', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'europe-rome', name: 'Rome', timezone: 'Europe/Rome', country: 'Italy', city: 'Rome', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'europe-madrid', name: 'Madrid', timezone: 'Europe/Madrid', country: 'Spain', city: 'Madrid', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'europe-amsterdam', name: 'Amsterdam', timezone: 'Europe/Amsterdam', country: 'Netherlands', city: 'Amsterdam', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'europe-zurich', name: 'Zurich', timezone: 'Europe/Zurich', country: 'Switzerland', city: 'Zurich', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'europe-moscow', name: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia', city: 'Moscow', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    
    // Asia
    { id: 'asia-tokyo', name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan', city: 'Tokyo', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'asia-shanghai', name: 'Shanghai', timezone: 'Asia/Shanghai', country: 'China', city: 'Shanghai', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'asia-hong-kong', name: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: 'Hong Kong', city: 'Hong Kong', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'asia-singapore', name: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore', city: 'Singapore', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'asia-mumbai', name: 'Mumbai', timezone: 'Asia/Kolkata', country: 'India', city: 'Mumbai', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'asia-dubai', name: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE', city: 'Dubai', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'asia-seoul', name: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea', city: 'Seoul', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    
    // Australia/Oceania
    { id: 'australia-sydney', name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia', city: 'Sydney', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'australia-melbourne', name: 'Melbourne', timezone: 'Australia/Melbourne', country: 'Australia', city: 'Melbourne', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'pacific-auckland', name: 'Auckland', timezone: 'Pacific/Auckland', country: 'New Zealand', city: 'Auckland', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    
    // South America
    { id: 'america-sao-paulo', name: 'São Paulo', timezone: 'America/Sao_Paulo', country: 'Brazil', city: 'São Paulo', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'america-buenos-aires', name: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires', country: 'Argentina', city: 'Buenos Aires', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    
    // Africa
    { id: 'africa-cairo', name: 'Cairo', timezone: 'Africa/Cairo', country: 'Egypt', city: 'Cairo', offset: '', time: new Date(), displayTime: '', displayDate: '' },
    { id: 'africa-johannesburg', name: 'Johannesburg', timezone: 'Africa/Johannesburg', country: 'South Africa', city: 'Johannesburg', offset: '', time: new Date(), displayTime: '', displayDate: '' }
  ];

  // Computed signals
  readonly displayedTimezones = computed(() => {
    const selected = this.selectedTimezones();
    const primary = this.primaryTimezone();
    const currentTime = this.currentTime();
    
    return this.availableTimezones
      .filter(tz => selected.includes(tz.timezone))
      .map(tz => {
        const time = new Date(currentTime.toLocaleString('en-US', { timeZone: tz.timezone }));
        const displayTime = this.formatTime(time);
        const displayDate = this.formatDate(time);
        const offset = this.getTimezoneOffset(tz.timezone);
        
        return {
          ...tz,
          time,
          displayTime,
          displayDate,
          offset,
          isPrimary: tz.timezone === primary
        };
      })
      .sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return a.name.localeCompare(b.name);
      });
  });

  readonly primaryTimezoneInfo = computed(() => {
    return this.displayedTimezones().find(tz => tz.isPrimary);
  });

  readonly timezoneRegions = computed(() => {
    const regions: { [key: string]: TimeZoneInfo[] } = {};
    
    this.availableTimezones.forEach(tz => {
      const region = tz.timezone.split('/')[0].replace('_', ' ');
      if (!regions[region]) {
        regions[region] = [];
      }
      regions[region].push(tz);
    });
    
    return regions;
  });

  private timeInterval?: number;

  constructor() {
    // Load saved settings
    this.loadSettings();

    // Start time updates
    this.startTimeUpdates();

    // Auto-save settings effect
    effect(() => {
      const settings: ClockSettings = {
        format24Hour: this.format24Hour(),
        showSeconds: this.showSeconds(),
        showDate: this.showDate(),
        showTimezone: this.showTimezone(),
        selectedTimezones: this.selectedTimezones(),
        primaryTimezone: this.primaryTimezone()
      };
      
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('clockSettings', JSON.stringify(settings));
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timeInterval && typeof window !== 'undefined') {
      clearInterval(this.timeInterval);
    }
  }

  // Time formatting methods
  private formatTime(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !this.format24Hour()
    };

    if (this.showSeconds()) {
      options.second = '2-digit';
    }

    return date.toLocaleTimeString([], options);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private getTimezoneOffset(timezone: string): string {
    const date = new Date();
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc + this.getTimezoneOffsetMinutes(timezone) * 60000);
    const offset = (targetTime.getTime() - utc) / (1000 * 60 * 60);
    
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.abs(offset) % 1 * 60;
    
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private getTimezoneOffsetMinutes(timezone: string): number {
    const date = new Date();
    const localTime = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const utcTime = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    
    return (localTime.getTime() - utcTime.getTime()) / (1000 * 60);
  }

  // Settings methods
  private loadSettings(): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('clockSettings');
      if (stored) {
        const settings: ClockSettings = JSON.parse(stored);
        this.format24Hour.set(settings.format24Hour ?? false);
        this.showSeconds.set(settings.showSeconds ?? true);
        this.showDate.set(settings.showDate ?? true);
        this.showTimezone.set(settings.showTimezone ?? true);
        this.selectedTimezones.set(settings.selectedTimezones ?? ['America/New_York', 'Europe/London', 'Asia/Tokyo']);
        this.primaryTimezone.set(settings.primaryTimezone ?? 'America/New_York');
      }
    } catch (error) {
      console.warn('Error loading clock settings:', error);
    }
  }

  // Time update methods
  private startTimeUpdates(): void {
    if (typeof window !== 'undefined') {
      this.updateTime();
      this.timeInterval = window.setInterval(() => {
        this.updateTime();
      }, 1000);
    }
  }

  private updateTime(): void {
    this.currentTime.set(new Date());
  }

  // Timezone management
  addTimezone(timezone: string): void {
    const current = this.selectedTimezones();
    if (!current.includes(timezone)) {
      this.selectedTimezones.set([...current, timezone]);
    }
  }

  removeTimezone(timezone: string): void {
    const current = this.selectedTimezones();
    const updated = current.filter(tz => tz !== timezone);
    
    // Ensure we have at least one timezone
    if (updated.length === 0) {
      return;
    }
    
    this.selectedTimezones.set(updated);
    
    // If we removed the primary timezone, set a new primary
    if (this.primaryTimezone() === timezone) {
      this.primaryTimezone.set(updated[0]);
    }
  }

  setPrimaryTimezone(timezone: string): void {
    this.primaryTimezone.set(timezone);
    
    // Add to selected if not already there
    if (!this.selectedTimezones().includes(timezone)) {
      this.addTimezone(timezone);
    }
  }

  // Display methods
  toggleSettings(): void {
    this.showSettings.update(show => !show);
  }

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

  // Format toggles
  toggleFormat(): void {
    this.format24Hour.update(format => !format);
  }

  toggleSeconds(): void {
    this.showSeconds.update(show => !show);
  }

  toggleDate(): void {
    this.showDate.update(show => !show);
  }

  toggleTimezoneDisplay(): void {
    this.showTimezone.update(show => !show);
  }

  // Utility methods
  getAvailableTimezones(): TimeZoneInfo[] {
    const selected = this.selectedTimezones();
    return this.availableTimezones.filter(tz => !selected.includes(tz.timezone));
  }

  resetToDefaults(): void {
    this.format24Hour.set(false);
    this.showSeconds.set(true);
    this.showDate.set(true);
    this.showTimezone.set(true);
    this.selectedTimezones.set(['America/New_York', 'Europe/London', 'Asia/Tokyo']);
    this.primaryTimezone.set('America/New_York');
  }

  exportSettings(): string {
    const settings: ClockSettings = {
      format24Hour: this.format24Hour(),
      showSeconds: this.showSeconds(),
      showDate: this.showDate(),
      showTimezone: this.showTimezone(),
      selectedTimezones: this.selectedTimezones(),
      primaryTimezone: this.primaryTimezone()
    };
    
    return JSON.stringify(settings, null, 2);
  }

  importSettings(settingsJson: string): boolean {
    try {
      const settings: ClockSettings = JSON.parse(settingsJson);
      
      this.format24Hour.set(settings.format24Hour ?? false);
      this.showSeconds.set(settings.showSeconds ?? true);
      this.showDate.set(settings.showDate ?? true);
      this.showTimezone.set(settings.showTimezone ?? true);
      this.selectedTimezones.set(settings.selectedTimezones ?? ['America/New_York']);
      this.primaryTimezone.set(settings.primaryTimezone ?? 'America/New_York');
      
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }
}