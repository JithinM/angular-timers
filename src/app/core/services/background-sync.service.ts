import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export interface BackgroundSyncEvent {
  id: string;
  name: string;
  lastSync: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class BackgroundSyncService {
  private syncEvents: BackgroundSyncEvent[] = [];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeBackgroundSync();
    }
  }

  private initializeBackgroundSync(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Register for background sync when online
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration: any) => {
        // Register for background sync when online
        if ('sync' in registration) {
          registration.sync.register('background-sync').catch((error: any) => {
            console.error('Background sync registration failed:', error);
          });
        }
      });
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private async executeSync(event: BackgroundSyncEvent): Promise<boolean> {
    try {
      event.status = 'in-progress';
      
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      event.status = 'completed';
      event.lastSync = new Date();
      return true;
    } catch (error) {
      event.status = 'failed';
      console.error('Sync failed for event:', event.name, error);
      return false;
    }
  }

  /**
   * Register a sync event that will be triggered when the app has connectivity
   */
  registerSyncEvent(name: string, data: any = {}): Observable<boolean> {
    return new Observable((observer) => {
      if (!isPlatformBrowser(this.platformId)) {
        observer.next(false);
        observer.complete();
        return;
      }

      const event: BackgroundSyncEvent = {
        id: this.generateId(),
        name,
        lastSync: new Date(),
        status: 'pending',
        data
      };

      this.syncEvents.push(event);

      // If we have network, execute immediately
      if (navigator.onLine) {
        this.executeSync(event).then((success) => {
          observer.next(success);
          observer.complete();
        });
      } else {
        // Store for later execution
        observer.next(true);
        observer.complete();
      }
    });
  }

  /**
   * Get all sync events
   */
  getSyncEvents(): BackgroundSyncEvent[] {
    return [...this.syncEvents];
  }

  /**
   * Retry a failed sync event
   */
  retrySyncEvent(id: string): Observable<boolean> {
    return new Observable((observer) => {
      const event = this.syncEvents.find(e => e.id === id);
      if (event) {
        event.status = 'pending';
        this.registerSyncEvent(event.name, event.data).subscribe(observer);
      } else {
        observer.next(false);
        observer.complete();
      }
    });
  }
}