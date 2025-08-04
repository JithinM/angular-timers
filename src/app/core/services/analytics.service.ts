import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface TimerEvent {
  eventType: 'timer_start' | 'timer_pause' | 'timer_reset' | 'timer_complete' | 'segment_complete';
  timerType: string;
  duration?: number; // in seconds
  segmentTitle?: string;
  timestamp: Date;
}

export interface UserEvent {
  eventType: 'page_view' | 'button_click' | 'form_submit' | 'ad_interaction';
  elementId?: string;
  page?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Track a timer event
   * @param event Timer event to track
   */
  trackTimerEvent(event: TimerEvent): void {
    if (!this.isBrowser) {
      return;
    }

    // In a real implementation, you would send this data to an analytics service
    // For example, Google Analytics, Mixpanel, or a custom backend API
    console.log('[Analytics] Timer Event:', event);

    // Example Google Analytics 4 event tracking (if gtag is available):
    // if (typeof (window as any).gtag !== 'undefined') {
    //   (window as any).gtag('event', event.eventType, {
    //     timer_type: event.timerType,
    //     duration: event.duration,
    //     segment_title: event.segmentTitle
    //   });
    // }
  }

  /**
   * Track a user interaction event
   * @param event User event to track
   */
  trackUserEvent(event: UserEvent): void {
    if (!this.isBrowser) {
      return;
    }

    // In a real implementation, you would send this data to an analytics service
    console.log('[Analytics] User Event:', event);

    // Example Google Analytics 4 event tracking (if gtag is available):
    // if (typeof (window as any).gtag !== 'undefined') {
    //   (window as any).gtag('event', event.eventType, {
    //     element_id: event.elementId,
    //     page: event.page
    //   });
    // }
  }

  /**
   * Track page view
   * @param page Page URL or name
   */
  trackPageView(page: string): void {
    if (!this.isBrowser) {
      return;
    }

    this.trackUserEvent({
      eventType: 'page_view',
      page: page,
      timestamp: new Date()
    });

    // Example Google Analytics 4 page view tracking (if gtag is available):
    // if (typeof (window as any).gtag !== 'undefined') {
    //   (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
    //     page_path: page
    //   });
    // }
  }

  /**
   * Track button click
   * @param elementId ID of the clicked element
   * @param context Additional context about the click
   */
  trackButtonClick(elementId: string, context?: string): void {
    if (!this.isBrowser) {
      return;
    }

    this.trackUserEvent({
      eventType: 'button_click',
      elementId: elementId,
      timestamp: new Date()
    });
  }

  /**
   * Track form submission
   * @param formId ID of the submitted form
   * @param fields Form fields and their values (without sensitive data)
   */
  trackFormSubmit(formId: string, fields: Record<string, any>): void {
    if (!this.isBrowser) {
      return;
    }

    this.trackUserEvent({
      eventType: 'form_submit',
      elementId: formId,
      timestamp: new Date()
    });
  }

  /**
   * Track ad interaction
   * @param adSlotId ID of the ad slot
   * @param interactionType Type of interaction (impression, click, etc.)
   */
  trackAdInteraction(adSlotId: string, interactionType: string): void {
    if (!this.isBrowser) {
      return;
    }

    this.trackUserEvent({
      eventType: 'ad_interaction',
      elementId: adSlotId,
      timestamp: new Date()
    });
  }

  /**
   * Track ad impression
   * @param adSlotId ID of the ad slot
   * @param adUnitId Ad unit ID
   * @param metadata Additional metadata
   */
  trackAdImpression(adSlotId: string, adUnitId: string, metadata?: Record<string, any>): void {
    if (!this.isBrowser) {
      return;
    }

    this.trackUserEvent({
      eventType: 'ad_interaction',
      elementId: adSlotId,
      timestamp: new Date()
    });
  }

  /**
   * Track ad view
   * @param adSlotId ID of the ad slot
   * @param adUnitId Ad unit ID
   * @param metadata Additional metadata
   */
  trackAdView(adSlotId: string, adUnitId: string, metadata?: Record<string, any>): void {
    if (!this.isBrowser) {
      return;
    }

    this.trackUserEvent({
      eventType: 'ad_interaction',
      elementId: adSlotId,
      timestamp: new Date()
    });
  }

  /**
   * Track ad error
   * @param adSlotId ID of the ad slot
   * @param adUnitId Ad unit ID
   * @param error Error message
   * @param metadata Additional metadata
   */
  trackAdError(adSlotId: string, adUnitId: string, error: string, metadata?: Record<string, any>): void {
    if (!this.isBrowser) {
      return;
    }

    this.trackUserEvent({
      eventType: 'ad_interaction',
      elementId: adSlotId,
      timestamp: new Date()
    });
  }

  /**
   * Track ad click
   * @param adSlotId ID of the ad slot
   * @param adUnitId Ad unit ID
   * @param metadata Additional metadata
   */
  trackAdClick(adSlotId: string, adUnitId: string, metadata?: Record<string, any>): void {
    if (!this.isBrowser) {
      return;
    }

    this.trackUserEvent({
      eventType: 'ad_interaction',
      elementId: adSlotId,
      timestamp: new Date()
    });
  }

  /**
   * Track timer start event
   * @param timerType Type of timer (e.g., 'egg-timer', 'bomb-timer')
   * @param duration Timer duration in seconds
   */
  trackTimerStart(timerType: string, duration: number): void {
    this.trackTimerEvent({
      eventType: 'timer_start',
      timerType: timerType,
      duration: duration,
      timestamp: new Date()
    });
  }

  /**
   * Track timer pause event
   * @param timerType Type of timer (e.g., 'egg-timer', 'bomb-timer')
   * @param elapsed Elapsed time in seconds
   */
  trackTimerPause(timerType: string, elapsed: number): void {
    this.trackTimerEvent({
      eventType: 'timer_pause',
      timerType: timerType,
      duration: elapsed,
      timestamp: new Date()
    });
  }

  /**
   * Track timer reset event
   * @param timerType Type of timer (e.g., 'egg-timer', 'bomb-timer')
   */
  trackTimerReset(timerType: string): void {
    this.trackTimerEvent({
      eventType: 'timer_reset',
      timerType: timerType,
      timestamp: new Date()
    });
  }

  /**
   * Track timer completion event
   * @param timerType Type of timer (e.g., 'egg-timer', 'bomb-timer')
   * @param duration Timer duration in seconds
   */
  trackTimerComplete(timerType: string, duration: number): void {
    this.trackTimerEvent({
      eventType: 'timer_complete',
      timerType: timerType,
      duration: duration,
      timestamp: new Date()
    });
  }

  /**
   * Track segment completion event (for presentation timer)
   * @param segmentTitle Title of the completed segment
   * @param duration Segment duration in seconds
   */
  trackSegmentComplete(segmentTitle: string, duration: number): void {
    this.trackTimerEvent({
      eventType: 'segment_complete',
      timerType: 'presentation-timer',
      segmentTitle: segmentTitle,
      duration: duration,
      timestamp: new Date()
    });
  }
}