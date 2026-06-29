import { Component, OnInit, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe, NgClass } from '@angular/common';
import { ScanService } from '../../core/services/scan.service';
import { getHealthClass, getHealthLabel, Scan } from '../../core/models/scan.model';

@Component({
  selector: 'radar-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DatePipe,
    NgClass,
  ],
  template: `
    <div class="dashboard-page slide-up">
      <header class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="subtitle">Overzicht van al je platform health scans</p>
        </div>
        <a mat-flat-button routerLink="/scan" color="primary" class="new-scan-btn">
          <mat-icon>add</mat-icon>
          Nieuwe Scan
        </a>
      </header>

      <!-- Stats row -->
      <div class="stats-grid">
        <div class="stat-card">
          <mat-icon class="stat-icon">analytics</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ scanService.scans().length }}</span>
            <span class="stat-label">Totaal Scans</span>
          </div>
        </div>
        <div class="stat-card">
          <mat-icon class="stat-icon" [class.pulse]="hasPending()">sync</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ scanService.pendingScans().length }}</span>
            <span class="stat-label">Actieve Scans</span>
          </div>
        </div>
        <div class="stat-card">
          <mat-icon class="stat-icon">check_circle</mat-icon>
          <div class="stat-content">
            <span class="stat-value">{{ scanService.completedScans().length }}</span>
            <span class="stat-label">Voltooid</span>
          </div>
        </div>
        <div class="stat-card">
          <mat-icon class="stat-icon">favorite</mat-icon>
          <div class="stat-content">
            <span class="stat-value"
                  [ngClass]="'health-score ' + getHealthClass(scanService.avgHealthScore())">
              {{ scanService.avgHealthScore() ?? '—' }}
              @if (scanService.avgHealthScore() !== null) { <small>/100</small> }
            </span>
            <span class="stat-label">Gem. Health Score</span>
          </div>
        </div>
      </div>

      <!-- Scan list -->
      @if (scanService.loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40" />
          <p>Scans laden...</p>
        </div>
      } @else if (scanService.scans().length === 0) {
        <div class="empty-state">
          <mat-icon>radar</mat-icon>
          <h3>Nog geen scans</h3>
          <p>Start een nieuwe scan om je platform te analyseren.</p>
          <a mat-stroked-button routerLink="/scan">Eerste scan starten</a>
        </div>
      } @else {
        <div class="scan-list">
          @for (scan of scanService.scans(); track scan.id) {
            <div class="scan-card" [routerLink]="['/scans', scan.id]">
              <div class="scan-card-left">
                <div class="repo-icon">
                  <mat-icon>folder</mat-icon>
                </div>
                <div class="scan-info">
                  <span class="repo-name">{{ scan.repoName }}</span>
                  <span class="scan-meta">
                    {{ scan.createdAt | date:'d MMM yyyy, HH:mm' }}
                    @if (scan.javaVersion) { · Java {{ scan.javaVersion }} }
                    @if (scan.springBootVersion) { · Spring {{ scan.springBootVersion }} }
                    @if (scan.angularVersion) { · Angular {{ scan.angularVersion }} }
                  </span>
                </div>
              </div>

              <div class="scan-card-right">
                @if (scan.status === 'COMPLETED' && scan.healthScore !== null) {
                  <div class="score-circle" [ngClass]="getHealthClass(scan.healthScore)">
                    <span class="score-value">{{ scan.healthScore }}</span>
                    <span class="score-label">score</span>
                  </div>
                } @else if (scan.status === 'SCANNING' || scan.status === 'PENDING') {
                  <div class="status-badge scanning">
                    <mat-spinner diameter="16" class="pulse" />
                    <span>{{ scan.status === 'SCANNING' ? 'Scanning...' : 'Wachtrij' }}</span>
                  </div>
                } @else if (scan.status === 'FAILED') {
                  <div class="status-badge failed">
                    <mat-icon>error</mat-icon>
                    <span>Mislukt</span>
                  </div>
                }

                <div class="finding-counts">
                  @if (scan.findings) {
                    @let high = countBySeverity(scan, 'HIGH');
                    @let medium = countBySeverity(scan, 'MEDIUM');
                    @if (high > 0) {
                      <span class="severity-chip HIGH" matTooltip="{{ high }} kritieke bevinding(en)">
                        {{ high }} HIGH
                      </span>
                    }
                    @if (medium > 0) {
                      <span class="severity-chip MEDIUM" matTooltip="{{ medium }} medium bevinding(en)">
                        {{ medium }} MEDIUM
                      </span>
                    }
                  }
                </div>

                <mat-icon class="arrow-icon">chevron_right</mat-icon>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page {
      padding: 32px;
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;

      h1 {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 4px;
        color: var(--radar-text);
      }

      .subtitle {
        color: var(--radar-text-secondary);
        margin: 0;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;

      .stat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #60a5fa;
        opacity: 0.8;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        line-height: 1;
        color: var(--radar-text);

        small { font-size: 14px; color: var(--radar-text-secondary); }
      }

      .stat-label {
        font-size: 12px;
        color: var(--radar-text-secondary);
      }
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      gap: 12px;
      color: var(--radar-text-secondary);

      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }
      h3 { font-size: 18px; font-weight: 600; margin: 0; color: var(--radar-text); }
      p { margin: 0; }
    }

    .scan-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .scan-card {
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      transition: all 0.15s;

      &:hover {
        border-color: rgba(96, 165, 250, 0.4);
        background: var(--radar-surface-2);
      }
    }

    .scan-card-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .repo-icon {
        width: 40px;
        height: 40px;
        background: rgba(96, 165, 250, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon { color: #60a5fa; }
      }

      .repo-name {
        font-size: 15px;
        font-weight: 600;
        display: block;
        color: var(--radar-text);
      }

      .scan-meta {
        font-size: 12px;
        color: var(--radar-text-secondary);
      }
    }

    .scan-card-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .score-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px solid currentColor;

      &.excellent { color: #22c55e; }
      &.good      { color: #84cc16; }
      &.fair      { color: #f59e0b; }
      &.poor      { color: #ef4444; }

      .score-value { font-size: 14px; font-weight: 700; line-height: 1; }
      .score-label { font-size: 8px; opacity: 0.7; }
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 9999px;

      &.scanning { color: #60a5fa; background: rgba(96, 165, 250, 0.1); }
      &.failed   { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    }

    .finding-counts {
      display: flex;
      gap: 4px;
    }

    .severity-chip {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;

      &.HIGH   { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
      &.MEDIUM { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    }

    .arrow-icon {
      color: var(--radar-text-secondary);
      opacity: 0.4;
    }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .dashboard-page { padding: 16px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  readonly scanService = inject(ScanService);

  readonly hasPending = computed(() => this.scanService.pendingScans().length > 0);

  readonly getHealthClass = getHealthClass;
  readonly getHealthLabel = getHealthLabel;

  ngOnInit(): void {
    this.scanService.loadAllScans();
  }

  countBySeverity(scan: Scan, severity: string): number {
    return scan.findings?.filter(f => f.severity === severity).length ?? 0;
  }
}
