import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'radar-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <div class="app-shell">
      <nav class="sidebar">
        <div class="sidebar-logo">
          <mat-icon class="logo-icon">radar</mat-icon>
          <span class="logo-text">Platform<br><strong>Radar</strong></span>
        </div>

        <div class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link" matTooltip="Dashboard">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a routerLink="/scan" routerLinkActive="active" class="nav-link" matTooltip="Nieuwe scan">
            <mat-icon>add_circle</mat-icon>
            <span>Nieuwe Scan</span>
          </a>
        </div>

        <div class="sidebar-footer">
          <span class="version-badge">v1.0.0</span>
          <span class="stack-badge">Spring AI · Angular</span>
        </div>
      </nav>

      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .sidebar {
      width: 220px;
      flex-shrink: 0;
      background: var(--radar-surface);
      border-right: 1px solid var(--radar-border);
      display: flex;
      flex-direction: column;
      padding: 20px 0;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px 24px;
      border-bottom: 1px solid var(--radar-border);
      margin-bottom: 16px;

      .logo-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--radar-primary);
      }

      .logo-text {
        font-size: 14px;
        line-height: 1.3;
        color: var(--radar-text-secondary);

        strong {
          color: var(--radar-text);
          font-size: 16px;
        }
      }
    }

    .nav-links {
      flex: 1;
      padding: 0 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: var(--radar-text-secondary);
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s;

      mat-icon { font-size: 20px; width: 20px; height: 20px; }

      &:hover {
        background: var(--radar-surface-2);
        color: var(--radar-text);
      }

      &.active {
        background: rgba(25, 118, 210, 0.15);
        color: #60a5fa;

        mat-icon { color: #60a5fa; }
      }
    }

    .sidebar-footer {
      padding: 16px 20px 0;
      border-top: 1px solid var(--radar-border);
      margin-top: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .version-badge,
    .stack-badge {
      font-size: 10px;
      color: var(--radar-text-secondary);
      opacity: 0.6;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background: var(--radar-bg);
    }
  `]
})
export class AppComponent {}
