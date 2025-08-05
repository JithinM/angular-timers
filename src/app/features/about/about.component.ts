import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    AdSlotComponent
  ],
  template: `
    <div class="about-container">
      <!-- Top Ad Banner -->
      <app-ad-slot
        size="banner"
        position="top"
        [showPlaceholder]="true"
        class="no-print">
      </app-ad-slot>
      
      <!-- Header -->
      <header class="about-header">
        <h1>
          <mat-icon>info</mat-icon>
          About TimerTools
        </h1>
        <p>Free online timers and stopwatches for everyone</p>
      </header>

      <!-- Mission Section -->
      <section class="mission-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>rocket_launch</mat-icon>
              Our Mission
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              TimerTools was created to provide free, high-quality timing tools for people everywhere. 
              Whether you're cooking, exercising, studying, or working, we have the perfect timer for your needs.
            </p>
            <p>
              Our tools are designed to be simple, fast, and reliable - with no ads interrupting your workflow 
              and no signup required to get started.
            </p>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>stars</mat-icon>
              Key Features
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="features-grid">
              <div class="feature-item">
                <mat-icon color="primary">timer</mat-icon>
                <h3>Multiple Timer Types</h3>
                <p>Stopwatches, countdown timers, interval timers, and more</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">devices</mat-icon>
                <h3>Mobile & Desktop</h3>
                <p>Fully responsive design that works on any device</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">offline_bolt</mat-icon>
                <h3>Offline Support</h3>
                <p>Install as an app and use timers without internet</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">accessibility</mat-icon>
                <h3>Accessible</h3>
                <p>Keyboard shortcuts and screen reader support</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">volume_up</mat-icon>
                <h3>Audio Feedback</h3>
                <p>Customizable sounds for timer events</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">palette</mat-icon>
                <h3>Customizable</h3>
                <p>Personalize your timer experience</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">bar_chart</mat-icon>
                <h3>Statistics</h3>
                <p>Track your timing habits and productivity</p>
              </div>
              
              <div class="feature-item">
                <mat-icon color="primary">emoji_events</mat-icon>
                <h3>Achievements</h3>
                <p>Earn badges by using TimerTools consistently</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Privacy Section -->
      <section class="privacy-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>shield</mat-icon>
              Privacy & Security
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              We take your privacy seriously. TimerTools stores all your data locally on your device, 
              meaning your timing sessions never leave your computer or phone.
            </p>
            <p>
              We don't track your usage, sell your data, or show targeted ads. Our only goal is to help 
              you time your activities more effectively.
            </p>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Open Source Section -->
      <section class="open-source-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>code</mat-icon>
              Open Source
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              TimerTools is built with modern web technologies and is completely open source. 
              You can view our code, contribute improvements, or even host your own version.
            </p>
            <button mat-raised-button color="primary" (click)="openGitHub()">
              <mat-icon>open_in_new</mat-icon>
              View on GitHub
            </button>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Contact Section -->
      <section class="contact-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>
              <mat-icon>email</mat-icon>
              Get in Touch
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>
              Have feedback, suggestions, or found a bug? We'd love to hear from you!
            </p>
            <button mat-raised-button color="primary" (click)="sendEmail()">
              <mat-icon>mail</mat-icon>
              Send Email
            </button>
          </mat-card-content>
        </mat-card>
      </section>
      
      <!-- Bottom Ad Banner -->
      <app-ad-slot
        size="banner"
        position="bottom"
        [showPlaceholder]="true"
        class="no-print">
      </app-ad-slot>
    </div>
  `,
  styles: [`
    .about-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .about-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1rem;
    }

    .about-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 2.5rem;
      font-weight: 300;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }

    .about-header p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0;
    }

    mat-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    mat-card-header {
      margin-bottom: 1rem;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      font-weight: 500;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 1rem;
    }

    .feature-item {
      text-align: center;
      padding: 1rem;
    }

    .feature-item mat-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      margin-bottom: 1rem;
    }

    .feature-item h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 500;
    }

    .feature-item p {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    button mat-icon {
      margin-right: 0.5rem;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .about-header h1 {
        font-size: 2rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .feature-item {
        padding: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .about-container {
        padding: 0.75rem;
      }

      .about-header h1 {
        font-size: 1.75rem;
      }
    }
  `]
})
export class AboutComponent {
  openGitHub(): void {
    window.open('https://github.com/your-repo/timer-tools', '_blank');
  }

  sendEmail(): void {
    window.location.href = 'mailto:feedback@timertools.com?subject=TimerTools%20Feedback';
  }
}