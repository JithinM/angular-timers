import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { StorageService } from '../../../core/services/storage.service';

export type AdSlotSize = 'banner' | 'rectangle' | 'mobile-banner' | 'leaderboard' | 'skyscraper';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="ad-slot-container"
      [ngClass]="[size, position]"
      [style.display]="(isVisible && adsVisible()) ? 'flex' : 'none'"
      [attr.aria-label]="'Advertisement'"
      role="img"
    >
      <div 
        #adContainer
        class="ad-slot"
        [ngClass]="size"
        [id]="adId"
      >
        <!-- Placeholder content for development -->
        <div *ngIf="showPlaceholder" class="ad-placeholder">
          <div class="placeholder-content">
            <span class="placeholder-text">Advertisement</span>
            <span class="placeholder-size">{{ getAdDimensions() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ad-slot-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: var(--ad-margin, 16px 0);
      width: 100%;
    }

    .ad-slot {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    /* Ad slot sizes */
    .banner {
      width: 728px;
      height: 90px;
      max-width: 100%;
    }

    .rectangle {
      width: 300px;
      height: 250px;
    }

    .mobile-banner {
      width: 320px;
      height: 50px;
      max-width: 100%;
    }

    .leaderboard {
      width: 728px;
      height: 90px;
      max-width: 100%;
    }

    .skyscraper {
      width: 160px;
      height: 600px;
    }

    /* Position variants */
    .top {
      margin-top: 0;
      margin-bottom: 24px;
    }

    .bottom {
      margin-top: 24px;
      margin-bottom: 0;
    }

    .sidebar {
      margin: 0;
    }

    .inline {
      margin: 16px 0;
    }

    /* Placeholder styling for development */
    .ad-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      color: #6c757d;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 2px dashed #dee2e6;
    }

    .placeholder-content {
      text-align: center;
      line-height: 1.4;
    }

    .placeholder-text {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .placeholder-size {
      display: block;
      font-size: 0.75rem;
      opacity: 0.7;
    }

    /* Responsive behavior */
    @media (max-width: 768px) {
      .banner,
      .leaderboard {
        width: 100%;
        max-width: 320px;
        height: 50px;
      }

      .rectangle {
        width: 100%;
        max-width: 300px;
        height: 250px;
      }

      .skyscraper {
        display: none; /* Hide skyscraper ads on mobile */
      }

      .ad-slot-container.sidebar {
        justify-content: center;
        margin: 16px 0;
      }
    }

    @media (max-width: 480px) {
      .ad-slot-container {
        margin: 12px 0;
      }

      .rectangle {
        height: 200px;
      }
    }

    /* Hide ads in print */
    @media print {
      .ad-slot-container {
        display: none !important;
      }
    }

    /* Accessibility improvements */
    .ad-slot {
      focus-within: {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
    }

    /* Loading state */
    .ad-slot.loading {
      background: linear-gradient(90deg, #f8f9fa 25%, #e9ecef 50%, #f8f9fa 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Error state */
    .ad-slot.error {
      background-color: #f8f9fa;
      border-color: #dc3545;
      border-style: dashed;
    }

    .ad-slot.error .ad-placeholder {
      background: #f8f9fa;
      color: #dc3545;
    }

    /* Success state (ad loaded) */
    .ad-slot.loaded {
      border: none;
      background: transparent;
    }

    /* Non-intrusive styling */
    .ad-slot-container.non-intrusive {
      opacity: 0.8;
      transition: opacity 0.3s ease;
    }

    .ad-slot-container.non-intrusive:hover {
      opacity: 1;
    }

    /* Sticky positioning for certain slots */
    .ad-slot-container.sticky {
      position: sticky;
      top: 20px;
      z-index: 10;
    }

    /* Dark theme support */
    @media (prefers-color-scheme: dark) {
      .ad-slot {
        background-color: #343a40;
        border-color: #495057;
      }

      .ad-placeholder {
        background: linear-gradient(135deg, #343a40 0%, #495057 100%);
        color: #adb5bd;
        border-color: #6c757d;
      }
    }
  `]
})
export class AdSlotComponent implements OnInit, OnDestroy {
  @Input() size: AdSlotSize = 'banner';
  @Input() position: 'top' | 'bottom' | 'sidebar' | 'inline' | 'sticky' = 'inline';
  @Input() adUnitId: string = '';
  @Input() isVisible: boolean = true;
  @Input() showPlaceholder: boolean = true; // Set to false in production
  @Input() nonIntrusive: boolean = true;
  
  @ViewChild('adContainer', { static: true }) adContainer!: ElementRef;
  
  private analyticsService = inject(AnalyticsService);
  private storageService = inject(StorageService);
  
  // Computed property that determines if ads should be visible
  adsVisible = computed(() => !this.storageService.preferences().adsDisabled);
  
  adId: string = '';
  private adLoaded: boolean = false;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  
  ngOnInit(): void {
    this.adId = this.generateAdId();
    
    // Track ad impression when component initializes
    this.analyticsService.trackAdImpression(this.adId, this.adUnitId, {
      size: this.size,
      position: this.position
    });
    
    if (!this.showPlaceholder) {
      this.loadAd();
    }
  }
  
  ngOnDestroy(): void {
    this.cleanup();
  }

  private generateAdId(): string {
    return `ad-slot-${this.size}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadAd(): void {
    if (this.adLoaded || !this.adUnitId) return;
    
    // Track ad impression when ad starts loading
    this.analyticsService.trackAdImpression(this.adId, this.adUnitId, {
      size: this.size,
      position: this.position
    });
    
    try {
      // Add loading state
      this.adContainer.nativeElement.classList.add('loading');
      
      // In a real implementation, you would integrate with ad networks like:
      // - Google AdSense
      // - Media.net
      // - Amazon Publisher Services
      // - etc.
      
      // Example Google AdSense integration (pseudocode):
      // (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      // (window as any).adsbygoogle.push({});
      
      // Simulate ad loading for development
      setTimeout(() => {
        this.onAdLoaded();
      }, 1000);
      
    } catch (error) {
      console.warn('Error loading ad:', error);
      this.onAdError();
    }
  }

  private onAdLoaded(): void {
    this.adLoaded = true;
    this.adContainer.nativeElement.classList.remove('loading');
    this.adContainer.nativeElement.classList.add('loaded');
    
    // Track ad view when ad is successfully loaded
    this.analyticsService.trackAdView(this.adId, this.adUnitId, {
      size: this.size,
      position: this.position
    });
    
    // Hide placeholder when real ad loads
    this.showPlaceholder = false;
  }

  private onAdError(): void {
    this.adContainer.nativeElement.classList.remove('loading');
    this.adContainer.nativeElement.classList.add('error');
    
    // Track ad error
    this.analyticsService.trackAdError(this.adId, this.adUnitId, 'Ad failed to load', {
      retryCount: this.retryCount,
      size: this.size,
      position: this.position
    });
    
    // Retry loading with exponential backoff
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = Math.pow(2, this.retryCount) * 1000; // 2s, 4s, 8s
      
      setTimeout(() => {
        this.adContainer.nativeElement.classList.remove('error');
        this.loadAd();
      }, delay);
    }
  }

  private cleanup(): void {
    // Clean up any ad network resources
    // This is important to prevent memory leaks
  }

  getAdDimensions(): string {
    switch (this.size) {
      case 'banner':
      case 'leaderboard':
        return '728×90';
      case 'rectangle':
        return '300×250';
      case 'mobile-banner':
        return '320×50';
      case 'skyscraper':
        return '160×600';
      default:
        return '';
    }
  }

  // Method to track ad click (to be called by ad network or when ad is clicked)
  trackAdClick(): void {
    this.analyticsService.trackAdClick(this.adId, this.adUnitId, {
      size: this.size,
      position: this.position
    });
  }
  
  // Method to refresh ad (useful for single-page applications)
  refreshAd(): void {
    if (!this.showPlaceholder) {
      this.adLoaded = false;
      this.retryCount = 0;
      this.adContainer.nativeElement.classList.remove('loaded', 'error');
      this.loadAd();
    }
  }

  // Method to hide ad (for premium users, etc.)
  hideAd(): void {
    this.isVisible = false;
  }

  // Method to show ad
  showAd(): void {
    this.isVisible = true;
  }
}