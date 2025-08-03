import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private promptEvent: any;
  private isInstalled = new BehaviorSubject<boolean>(false);
  private updateAvailable = new BehaviorSubject<boolean>(false);

  isInstalled$ = this.isInstalled.asObservable();
  updateAvailable$ = this.updateAvailable.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.initPwaPrompt();
      this.checkInstallationStatus();
    }
  }

  private initPwaPrompt(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.promptEvent = event;
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled.next(true);
      this.promptEvent = null;
    });
  }

  private checkInstallationStatus(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Check if the app is running in standalone mode (installed PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window as any).navigator.standalone) {
      this.isInstalled.next(true);
    }
  }

  promptInstall(): void {
    if (!this.promptEvent) return;

    this.promptEvent.prompt();
    this.promptEvent.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        this.isInstalled.next(true);
      }
      this.promptEvent = null;
    });
  }

  isInstallable(): boolean {
    return !!this.promptEvent;
  }

  isAppInstalled(): boolean {
    return this.isInstalled.value;
  }

  checkForUpdates(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          this.updateAvailable.next(true);
        }
      });
    }
  }

  updateApp(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          this.updateAvailable.next(false);
          window.location.reload();
        }
      });
    }
  }

  getNetworkStatus(): Observable<boolean> {
    const networkStatus = new BehaviorSubject<boolean>(true);
    
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('online', () => networkStatus.next(true));
      window.addEventListener('offline', () => networkStatus.next(false));
      
      networkStatus.next(navigator.onLine);
    }
    
    return networkStatus.asObservable();
  }

  enableBackgroundSync(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration: any) => {
        registration.sync.register('timer-sync').catch((error: any) => {
          console.error('Background sync registration failed:', error);
        });
      });
    }
  }

  subscribeToPushNotifications(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return Promise.resolve();

    return new Promise((resolve, reject) => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        reject(new Error('Push notifications not supported'));
        return;
      }

      navigator.serviceWorker.ready.then((registration) => {
        const subscribeOptions = {
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array('YOUR_PUBLIC_VAPID_KEY_HERE')
        };

        registration.pushManager.subscribe(subscribeOptions)
          .then((subscription) => {
            // Send subscription to your server
            console.log('Push notification subscription:', subscription);
            resolve();
          })
          .catch(reject);
      });
    });
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}