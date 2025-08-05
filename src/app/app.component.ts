import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AudioService } from './core/services/audio.service';
import { AdSlotComponent } from './shared/components/ad-slot/ad-slot.component';
import { PwaInstallComponent } from './shared/components/pwa-install/pwa-install.component';
import { PwaUpdateComponent } from './shared/components/pwa-update/pwa-update.component';
import { PwaService } from './core/services/pwa.service';
import { SeoService } from './core/services/seo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    AdSlotComponent,
    PwaInstallComponent,
    PwaUpdateComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'angular-timers';
  currentYear = new Date().getFullYear();
  mobileMenuOpen = false;
  dropdownOpen = false;
  clockDropdownOpen = false;

  constructor(
    public audioService: AudioService,
    private pwaService: PwaService,
    private seoService: SeoService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Initialize audio context on user interaction
    this.audioService.resumeAudioContext();
    
    // Set default SEO metadata
    this.seoService.resetToDefault();
    
    if (isPlatformBrowser(this.platformId)) {
      // Enable background sync for timer persistence
      this.pwaService.enableBackgroundSync();
      
      // Check for updates periodically
      setInterval(() => {
        this.pwaService.checkForUpdates();
      }, 1000 * 60 * 10); // Check every 10 minutes
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    this.audioService.playButtonClick();
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    this.audioService.playButtonClick();
  }
  
  toggleClockDropdown(): void {
    this.clockDropdownOpen = !this.clockDropdownOpen;
    this.audioService.playButtonClick();
  }

  toggleAudio(): void {
    this.audioService.toggleAudio();
    this.audioService.playButtonClick();
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    this.dropdownOpen = false;
    this.clockDropdownOpen = false;
  }
}
