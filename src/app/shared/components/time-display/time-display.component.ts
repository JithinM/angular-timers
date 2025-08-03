import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-time-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="time-display"
      [ngClass]="{
        'large-timer': size === 'large',
        'medium-timer': size === 'medium',
        'small-timer': size === 'small',
        'running': status === 'running',
        'paused': status === 'paused',
        'stopped': status === 'stopped',
        'expired': status === 'expired',
        'pulse': animate && status === 'running'
      }"
      [style.color]="getStatusColor()"
      [attr.aria-label]="'Timer display showing ' + time"
      role="timer"
    >
      {{ time }}
    </div>
  `,
  styles: [`
    .time-display {
      font-family: 'Roboto Mono', monospace;
      font-weight: 300;
      text-align: center;
      user-select: none;
      transition: all 0.3s ease;
      letter-spacing: 0.05em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .large-timer {
      font-size: clamp(3rem, 12vw, 8rem);
      line-height: 1.1;
      margin: 1rem 0;
    }

    .medium-timer {
      font-size: clamp(2rem, 8vw, 4rem);
      line-height: 1.2;
      margin: 0.75rem 0;
    }

    .small-timer {
      font-size: clamp(1.2rem, 4vw, 2rem);
      line-height: 1.3;
      margin: 0.5rem 0;
    }

    .running {
      color: var(--timer-running-color);
    }

    .paused {
      color: var(--timer-paused-color);
    }

    .stopped {
      color: var(--text-primary);
    }

    .expired {
      color: var(--timer-stopped-color);
      animation: flash 1s infinite;
    }

    .pulse {
      animation: pulse 2s infinite;
    }

    @keyframes flash {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.5; }
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }

    @media (max-width: 768px) {
      .large-timer {
        font-size: clamp(2.5rem, 15vw, 6rem);
      }
      
      .medium-timer {
        font-size: clamp(1.8rem, 10vw, 3rem);
      }
    }
  `]
})
export class TimeDisplayComponent {
  @Input() time: string = '00:00.00';
  @Input() size: 'small' | 'medium' | 'large' = 'large';
  @Input() status: 'running' | 'paused' | 'stopped' | 'expired' = 'stopped';
  @Input() animate: boolean = true;

  getStatusColor(): string {
    switch (this.status) {
      case 'running':
        return 'var(--timer-running-color)';
      case 'paused':
        return 'var(--timer-paused-color)';
      case 'expired':
        return 'var(--timer-stopped-color)';
      default:
        return 'var(--text-primary)';
    }
  }
}