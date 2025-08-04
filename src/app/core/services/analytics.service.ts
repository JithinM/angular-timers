import { Injectable } from '@angular/core';

export interface AdEvent {
  adSlotId: string;
  adUnitId: string;
  eventType: 'view' | 'click' | 'impression' | 'error';
  timestamp: Date;
  metadata?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private isAnalyticsLoaded = false;
  private adEvents: AdEvent[] = [];

  constructor() {
    this.initAnalytics();
  }

  private initAnalytics(): void {
    // Check if Google Analytics is already loaded
    if (typeof window !== 'undefined' && (window as any).gtag) {
      this.isAnalyticsLoaded = true;
      return;
    }

    // In a real implementation, you would load the Google Analytics script here
    // For now, we'll simulate the analytics functionality
    console.log('[AnalyticsService] Initializing analytics...');
    this.isAnalyticsLoaded = true;
  }

  /**
   * Track a custom event
   * @param eventName The name of the event
   * @param params Additional parameters to track
   */
  trackEvent(eventName: string, params: Record<string, any> = {}): void {
    if (!this.isAnalyticsLoaded) {
      console.warn('[AnalyticsService] Analytics not loaded, event not tracked:', eventName);
      return;
    }

    // In a real implementation, you would call gtag here:
    // gtag('event', eventName, params);
    
    console.log('[AnalyticsService] Tracking event:', eventName, params);
  }

  /**
   * Track an ad event
   * @param event The ad event to track
   */
  trackAdEvent(event: AdEvent): void {
    // Store the event locally
    this.adEvents.push(event);
    
    // Track the event with Google Analytics
    this.trackEvent(`ad_${event.eventType}`, {
      ad_slot_id: event.adSlotId,
      ad_unit_id: event.adUnitId,
      timestamp: event.timestamp,
      ...event.metadata
    });
    
    console.log('[AnalyticsService] Ad event tracked:', event);
  }

  /**
   * Track an ad impression (when an ad is displayed)
   * @param adSlotId The ID of the ad slot
   * @param adUnitId The ad unit ID
   * @param metadata Additional metadata
   */
  trackAdImpression(adSlotId: string, adUnitId: string, metadata?: Record<string, any>): void {
    this.trackAdEvent({
      adSlotId,
      adUnitId,
      eventType: 'impression',
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track an ad click
   * @param adSlotId The ID of the ad slot
   * @param adUnitId The ad unit ID
   * @param metadata Additional metadata
   */
  trackAdClick(adSlotId: string, adUnitId: string, metadata?: Record<string, any>): void {
    this.trackAdEvent({
      adSlotId,
      adUnitId,
      eventType: 'click',
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track an ad view (when an ad becomes visible)
   * @param adSlotId The ID of the ad slot
   * @param adUnitId The ad unit ID
   * @param metadata Additional metadata
   */
  trackAdView(adSlotId: string, adUnitId: string, metadata?: Record<string, any>): void {
    this.trackAdEvent({
      adSlotId,
      adUnitId,
      eventType: 'view',
      timestamp: new Date(),
      metadata
    });
  }

  /**
   * Track an ad error
   * @param adSlotId The ID of the ad slot
   * @param adUnitId The ad unit ID
   * @param error The error information
   * @param metadata Additional metadata
   */
  trackAdError(adSlotId: string, adUnitId: string, error: string, metadata?: Record<string, any>): void {
    this.trackAdEvent({
      adSlotId,
      adUnitId,
      eventType: 'error',
      timestamp: new Date(),
      metadata: {
        error,
        ...metadata
      }
    });
  }

  /**
   * Get all tracked ad events
   * @returns Array of ad events
   */
  getAdEvents(): AdEvent[] {
    return [...this.adEvents];
  }

  /**
   * Clear tracked ad events
   */
  clearAdEvents(): void {
    this.adEvents = [];
  }

  /**
   * Track page view
   * @param pagePath The path of the page
   * @param pageTitle The title of the page
   */
  trackPageView(pagePath: string, pageTitle: string): void {
    if (!this.isAnalyticsLoaded) {
      console.warn('[AnalyticsService] Analytics not loaded, page view not tracked:', pagePath);
      return;
    }

    // In a real implementation, you would call gtag here:
    // gtag('config', 'GA_MEASUREMENT_ID', {
    //   page_path: pagePath,
    //   page_title: pageTitle
    // });
    
    console.log('[AnalyticsService] Page view tracked:', pagePath, pageTitle);
  }

  /**
   * Track timer usage
   * @param timerType The type of timer
   * @param duration The duration of the timer session in milliseconds
   * @param action The action performed (start, complete, etc.)
   */
  trackTimerUsage(timerType: string, duration: number, action: string): void {
    this.trackEvent('timer_usage', {
      timer_type: timerType,
      duration_ms: duration,
      action: action
    });
  }

  /**
   * Track user engagement
   * @param action The engagement action
   * @param label Additional label for the action
   */
  trackEngagement(action: string, label?: string): void {
    this.trackEvent('user_engagement', {
      action: action,
      label: label
    });
  }
}