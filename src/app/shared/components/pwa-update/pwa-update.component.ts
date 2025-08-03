import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-update',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="pwa-update-container" *ngIf="showUpdatePrompt">
      <mat-card class="pwa-update-card">
        <mat-card-content>
          <div class="update-content">
            <mat-icon class="update-icon">system_update</mat-icon>
            <div class="update-text">
              <h3>Update Available</h3>
              <p>A new version of the app is available. Refresh to update.</p>
            </div>
          </div>
          <div class="update-actions">
            <button mat-raised-button color="primary" (click)="updateApp()">
              Update Now
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
    .pwa-update-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 400px;
    }

    .pwa-update-card {
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: 12px;
      overflow: hidden;
    }

    .update-content {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .update-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--primary-color);
    }

    .update-text h3 {
      margin: 0 0 8px 0;
      font-weight: 500;
      color: var(--text-primary);
    }

    .update-text p {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14px;
    }

    .update-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    @media (max-width: 768px) {
      .pwa-update-container {
        left: 20px;
        right: 20px;
        top: 10px;
      }
    }
  `]
})
export class PwaUpdateComponent implements OnInit {
  showUpdatePrompt = false;

  constructor(
    private pwaService: PwaService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Listen for update availability
      this.pwaService.updateAvailable$.subscribe((available) => {
        this.showUpdatePrompt = available;
      });

      // Check for updates periodically
      setInterval(() => {
        this.pwaService.checkForUpdates();
      }, 1000 * 60 * 5); // Check every 5 minutes
    }
  }

  updateApp(): void {
    this.pwaService.updateApp();
  }

  dismissPrompt(): void {
    this.showUpdatePrompt = false;
  }
}