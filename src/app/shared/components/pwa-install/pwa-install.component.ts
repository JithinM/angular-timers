import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-install',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="pwa-install-container" *ngIf="showInstallPrompt">
      <mat-card class="pwa-install-card">
        <mat-card-content>
          <div class="install-content">
            <mat-icon class="install-icon">get_app</mat-icon>
            <div class="install-text">
              <h3>Install Timer App</h3>
              <p>Get the full experience with offline access and push notifications</p>
            </div>
          </div>
          <div class="install-actions">
            <button mat-raised-button color="primary" (click)="installApp()">
              Install Now
            </button>
            <button mat-button (click)="dismissPrompt()">
              Later
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .pwa-install-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 400px;
    }

    .pwa-install-card {
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      overflow: hidden;
    }

    .install-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .install-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--primary-color);
    }

    .install-text h3 {
      margin: 0 0 8px 0;
      font-weight: 500;
      color: var(--text-primary);
    }

    .install-text p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .install-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .pwa-install-container {
        left: 20px;
        right: 20px;
        bottom: 10px;
      }
    }
  `]
})
export class PwaInstallComponent implements OnInit {
  showInstallPrompt = false;

  constructor(
    private pwaService: PwaService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Check if we should show the install prompt
      this.checkInstallPrompt();
    }
  }

  private checkInstallPrompt(): void {
    // Only show prompt if not already installed and installable
    if (this.pwaService.isInstallable() && !this.pwaService.isAppInstalled()) {
      // Check if user has dismissed prompt before (would use localStorage in real app)
      const hasDismissed = localStorage.getItem('pwa-install-dismissed');
      if (!hasDismissed) {
        this.showInstallPrompt = true;
      }
    }
  }

  installApp(): void {
    this.pwaService.promptInstall();
    this.showInstallPrompt = false;
  }

  dismissPrompt(): void {
    this.showInstallPrompt = false;
    localStorage.setItem('pwa-install-dismissed', 'true');
  }
}