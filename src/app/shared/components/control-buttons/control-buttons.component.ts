import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface TimerAction {
  action: 'start' | 'stop' | 'reset' | 'lap' | 'fullscreen' | 'settings';
  data?: any;
}

@Component({
  selector: 'app-control-buttons',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="control-buttons" [ngClass]="layout">
      <!-- Primary action button (Start/Stop) -->
      <button
        mat-fab
        color="primary"
        class="primary-button"
        [attr.aria-label]="isRunning ? 'Stop timer' : 'Start timer'"
        (click)="onAction(isRunning ? 'stop' : 'start')"
        [disabled]="disabled"
      >
        <mat-icon>{{ isRunning ? 'pause' : 'play_arrow' }}</mat-icon>
      </button>

      <!-- Secondary buttons -->
      <div class="secondary-buttons">
        <!-- Reset button -->
        <button
          mat-raised-button
          color="warn"
          [attr.aria-label]="'Reset timer'"
          (click)="onAction('reset')"
          [disabled]="disabled"
          class="control-btn reset-btn"
        >
          <mat-icon>restart_alt</mat-icon>
          <span class="btn-text">Reset</span>
        </button>

        <!-- Lap button (for stopwatch) -->
        <button
          *ngIf="showLap"
          mat-raised-button
          color="accent"
          [attr.aria-label]="'Add lap'"
          (click)="onAction('lap')"
          [disabled]="disabled || !isRunning"
          class="control-btn lap-btn"
        >
          <mat-icon>flag</mat-icon>
          <span class="btn-text">Lap</span>
        </button>

        <!-- Fullscreen button -->
        <button
          *ngIf="showFullscreen"
          mat-stroked-button
          [attr.aria-label]="'Toggle fullscreen'"
          (click)="onAction('fullscreen')"
          class="control-btn fullscreen-btn"
        >
          <mat-icon>{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon>
          <span class="btn-text hide-mobile">{{ isFullscreen ? 'Exit' : 'Full' }}</span>
        </button>

        <!-- Settings button -->
        <button
          *ngIf="showSettings"
          mat-stroked-button
          [attr.aria-label]="'Open settings'"
          (click)="onAction('settings')"
          class="control-btn settings-btn"
        >
          <mat-icon>settings</mat-icon>
          <span class="btn-text hide-mobile">Settings</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .control-buttons {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 1rem;
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
    }

    .primary-button {
      width: 80px;
      height: 80px;
      font-size: 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .primary-button:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .primary-button:active {
      transform: scale(0.95);
    }

    .secondary-buttons {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      width: 100%;
    }

    .control-btn {
      min-width: 100px;
      height: 48px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .control-btn mat-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .btn-text {
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Layout variants */
    .horizontal {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
    }

    .horizontal .primary-button {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
    }

    .horizontal .secondary-buttons {
      gap: 0.75rem;
    }

    .compact {
      gap: 1rem;
    }

    .compact .primary-button {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
    }

    .compact .control-btn {
      min-width: 80px;
      height: 40px;
    }

    .compact .btn-text {
      font-size: 0.75rem;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .control-buttons {
        gap: 1rem;
        padding: 0.75rem;
      }

      .primary-button {
        width: 70px;
        height: 70px;
        font-size: 1.75rem;
      }

      .secondary-buttons {
        gap: 0.75rem;
      }

      .control-btn {
        min-width: 80px;
        height: 44px;
      }

      .hide-mobile {
        display: none;
      }

      .btn-text {
        font-size: 0.75rem;
      }
    }

    @media (max-width: 480px) {
      .secondary-buttons {
        justify-content: space-around;
        width: 100%;
      }

      .control-btn {
        flex: 1;
        min-width: 70px;
        max-width: 90px;
      }

      .primary-button {
        width: 64px;
        height: 64px;
        font-size: 1.5rem;
      }
    }

    /* Animation states */
    .control-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    .control-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* Disabled state */
    .control-btn:disabled,
    .primary-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    /* Color themes for different buttons */
    .reset-btn {
      background-color: var(--warn-color);
      color: white;
    }

    .lap-btn {
      background-color: var(--accent-color);
      color: white;
    }

    .fullscreen-btn,
    .settings-btn {
      border-color: var(--border-color);
      color: var(--text-primary);
    }

    /* Focus styles for accessibility */
    .control-btn:focus,
    .primary-button:focus {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .control-btn,
      .primary-button {
        border: 2px solid currentColor;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .control-btn,
      .primary-button {
        transition: none;
      }
      
      .primary-button:hover:not(:disabled) {
        transform: none;
      }
      
      .control-btn:hover:not(:disabled) {
        transform: none;
      }
    }
  `]
})
export class ControlButtonsComponent {
  @Input() isRunning: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showLap: boolean = false;
  @Input() showFullscreen: boolean = true;
  @Input() showSettings: boolean = true;
  @Input() isFullscreen: boolean = false;
  @Input() layout: 'vertical' | 'horizontal' | 'compact' = 'vertical';

  @Output() action = new EventEmitter<TimerAction>();

  onAction(actionType: TimerAction['action'], data?: any): void {
    this.action.emit({ action: actionType, data });
  }
}