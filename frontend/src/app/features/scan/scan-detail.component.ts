import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { ScanService } from '../../core/services/scan.service';
import { Scan, getHealthClass, getHealthLabel, FindingCategory } from '../../core/models/scan.model';

@Component({
  selector: 'radar-scan-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    NgClass,
  ],
  template: `
    <div class="detail-page slide-up">
      @if (loading()) {
        <div class="center-state">
          <mat-spinner diameter="48" />
          <p>Scan laden...</p>
        </div>
      } @else if (scan()) {
        <header class="detail-header">
          <button mat-icon-button routerLink="/dashboard" matTooltip="Terug naar dashboard">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="header-content">
            <h1>{{ scan()!.repoName }}</h1>
            <a [href]="scan()!.repoUrl" target="_blank" class="repo-link">
              <mat-icon>open_in_new</mat-icon>
              {{ scan()!.repoUrl }}
            </a>
          </div>
          <div class="header-actions">
            @if (scan()!.status === 'COMPLETED') {
              <a mat-stroked-button [routerLink]="['/scans', scan()!.id, 'advice']">
                <mat-icon>psychology</mat-icon>
                AI Advies
              </a>
              <a mat-stroked-button [href]="scanService.getReportUrl(scan()!.id)" download>
                <mat-icon>download</mat-icon>
                Rapport (.md)
              </a>
            }
          </div>
        </header>

        <!-- Health Score Hero -->
        @if (scan()!.status === 'COMPLETED') {
          <div class="score-hero">
            <div class="score-ring" [ngClass]="getHealthClass(scan()!.healthScore)">
              <div class="score-ring-inner">
                <span class="score-num">{{ scan()!.healthScore }}</span>
                <span class="score-denom">/100</span>
                <span class="score-grade">{{ getHealthLabel(scan()!.healthScore) }}</span>
              </div>
            </div>
            <div class="score-details">
              <h2>Platform Health Score</h2>
              @if (scan()!.aiSummary) {
                <p class="ai-summary">{{ scan()!.aiSummary }}</p>
              }
              <div class="feature-flags">
                @for (flag of featureFlags(); track flag.label) {
                  <span class="chip" [ngClass]="flag.value ? 'chip-success' : 'chip-warn'"
                        [matTooltip]="flag.tooltip">
                    <mat-icon>{{ flag.value ? 'check' : 'close' }}</mat-icon>
                    {{ flag.label }}
                  </span>
                }
              </div>
            </div>
          </div>
        } @else {
          <div class="scanning-banner" [class.pulse]="isScanning()">
            <mat-spinner diameter="24" />
            <span>{{ scan()!.status === 'SCANNING' ? 'Scanning repository...' : 'In wachtrij...' }}</span>
            <span class="scan-progress-note">Dit kan 15-60 seconden duren</span>
          </div>
        }

        <!-- Versions grid -->
        @if (hasVersions()) {
          <div class="versions-section">
            <h3 class="section-title">Gedetecteerde Versies</h3>
            <div class="versions-grid">
              @if (scan()!.javaVersion) {
                <div class="version-card">
                  <span class="version-icon java">J</span>
                  <div>
                    <strong>Java</strong>
                    <span>{{ scan()!.javaVersion }}</span>
                  </div>
                </div>
              }
              @if (scan()!.springBootVersion) {
                <div class="version-card">
                  <span class="version-icon spring">S</span>
                  <div>
                    <strong>Spring Boot</strong>
                    <span>{{ scan()!.springBootVersion }}</span>
                  </div>
                </div>
              }
              @if (scan()!.angularVersion) {
                <div class="version-card">
                  <span class="version-icon angular">A</span>
                  <div>
                    <strong>Angular</strong>
                    <span>{{ scan()!.angularVersion }}</span>
                  </div>
                </div>
              }
              @if (scan()!.nodeVersion) {
                <div class="version-card">
                  <span class="version-icon node">N</span>
                  <div>
                    <strong>Node.js</strong>
                    <span>{{ scan()!.nodeVersion }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Findings -->
        @if (scan()!.findings.length) {
          <div class="findings-section">
            <h3 class="section-title">
              Bevindingen
              <span class="findings-count">{{ scan()!.findings.length }}</span>
            </h3>

            <!-- Category tabs -->
            <div class="category-filter">
              <button mat-stroked-button class="cat-btn"
                      [class.active]="activeCategory() === null"
                      (click)="activeCategory.set(null)">
                Alle ({{ scan()!.findings.length }})
              </button>
              @for (cat of findingCategories(); track cat.label) {
                <button mat-stroked-button class="cat-btn"
                        [class.active]="activeCategory() === cat.value"
                        (click)="activeCategory.set(cat.value)">
                  {{ cat.label }} ({{ cat.count }})
                </button>
              }
            </div>

            <div class="findings-list">
              @for (finding of filteredFindings(); track finding.id) {
                <div class="finding-card" [ngClass]="'severity-' + finding.severity">
                  <div class="finding-header">
                    <span class="severity-badge" [ngClass]="'sev-' + finding.severity">
                      {{ finding.severity }}
                    </span>
                    <span class="category-badge">{{ finding.category }}</span>
                    <strong class="finding-title">{{ finding.title }}</strong>
                  </div>
                  <p class="finding-desc">{{ finding.description }}</p>
                  @if (finding.recommendation) {
                    <div class="finding-rec">
                      <mat-icon>lightbulb</mat-icon>
                      <span>{{ finding.recommendation }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      } @else if (error()) {
        <div class="center-state error">
          <mat-icon>error</mat-icon>
          <p>{{ error() }}</p>
          <button mat-flat-button routerLink="/dashboard">Terug</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page {
      padding: 32px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .center-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 16px;
      color: var(--radar-text-secondary);

      &.error mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ef4444; }
    }

    .detail-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 32px;

      .header-content {
        flex: 1;

        h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
      }

      .repo-link {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #60a5fa;
        text-decoration: none;

        mat-icon { font-size: 14px; width: 14px; height: 14px; }
        &:hover { text-decoration: underline; }
      }

      .header-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }
    }

    .scanning-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: rgba(96, 165, 250, 0.08);
      border: 1px solid rgba(96, 165, 250, 0.2);
      border-radius: 12px;
      margin-bottom: 24px;
      color: #60a5fa;

      .scan-progress-note {
        font-size: 12px;
        color: var(--radar-text-secondary);
        margin-left: auto;
      }
    }

    .score-hero {
      display: flex;
      gap: 32px;
      align-items: center;
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
    }

    .score-ring {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 6px solid currentColor;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      &.excellent { color: #22c55e; }
      &.good      { color: #84cc16; }
      &.fair      { color: #f59e0b; }
      &.poor      { color: #ef4444; }
    }

    .score-ring-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .score-num  { font-size: 36px; font-weight: 800; line-height: 1; }
    .score-denom { font-size: 14px; color: var(--radar-text-secondary); }
    .score-grade { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; margin-top: 4px; }

    .score-details {
      flex: 1;

      h2 { font-size: 18px; font-weight: 600; margin: 0 0 12px; }
      .ai-summary { font-size: 14px; color: var(--radar-text-secondary); margin: 0 0 16px; line-height: 1.6; }
    }

    .feature-flags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--radar-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;

      .findings-count {
        background: var(--radar-surface-2);
        border-radius: 9999px;
        padding: 2px 8px;
        font-size: 12px;
        color: var(--radar-text);
        text-transform: none;
        letter-spacing: 0;
      }
    }

    .versions-section {
      margin-bottom: 32px;
    }

    .versions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    .version-card {
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;

      div {
        display: flex;
        flex-direction: column;
        gap: 2px;

        strong { font-size: 13px; font-weight: 600; }
        span   { font-size: 12px; color: var(--radar-text-secondary); font-family: monospace; }
      }
    }

    .version-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;

      &.java   { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
      &.spring { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
      &.angular { background: rgba(239, 68, 68, 0.15); color: #f87171; }
      &.node   { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    }

    .findings-section {
      margin-bottom: 32px;
    }

    .category-filter {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;

      .cat-btn {
        font-size: 12px;
        padding: 0 12px;
        height: 32px;
        border-radius: 9999px;
        border-color: var(--radar-border);
        color: var(--radar-text-secondary);
        transition: all 0.15s;

        &.active {
          border-color: #60a5fa;
          color: #60a5fa;
          background: rgba(96, 165, 250, 0.1);
        }
      }
    }

    .findings-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .finding-card {
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 10px;
      padding: 16px;
      border-left: 3px solid transparent;

      &.severity-HIGH   { border-left-color: #ef4444; }
      &.severity-MEDIUM { border-left-color: #f59e0b; }
      &.severity-LOW    { border-left-color: #3b82f6; }
      &.severity-INFO   { border-left-color: #6b7280; }
    }

    .finding-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .severity-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;

      &.sev-HIGH   { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
      &.sev-MEDIUM { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
      &.sev-LOW    { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
      &.sev-INFO   { background: rgba(107, 114, 128, 0.15); color: #9ca3af; }
    }

    .category-badge {
      font-size: 10px;
      color: var(--radar-text-secondary);
      background: var(--radar-surface-2);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .finding-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--radar-text);
    }

    .finding-desc {
      font-size: 13px;
      color: var(--radar-text-secondary);
      margin: 0 0 12px;
      line-height: 1.6;
    }

    .finding-rec {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      background: rgba(96, 165, 250, 0.06);
      border-radius: 8px;
      font-size: 13px;
      color: #93c5fd;

      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    }
  `]
})
export class ScanDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly scanService = inject(ScanService);

  readonly scan = signal<Scan | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeCategory = signal<FindingCategory | null>(null);

  readonly getHealthClass = getHealthClass;
  readonly getHealthLabel = getHealthLabel;

  readonly isScanning = computed(() =>
    this.scan()?.status === 'SCANNING' || this.scan()?.status === 'PENDING'
  );

  readonly hasVersions = computed(() => {
    const s = this.scan();
    return s && (s.javaVersion || s.springBootVersion || s.angularVersion || s.nodeVersion);
  });

  readonly featureFlags = computed(() => {
    const s = this.scan();
    if (!s) return [];
    return [
      { label: 'Docker',         value: s.dockerPresent,          tooltip: 'Dockerfile aanwezig' },
      { label: 'GitHub Actions', value: s.githubActionsPresent,   tooltip: 'CI/CD pipeline' },
      { label: 'OpenTelemetry',  value: s.openTelemetryPresent,   tooltip: 'Distributed tracing' },
      { label: 'Dependabot',     value: s.dependabotPresent,      tooltip: 'Dependency scanning' },
      { label: 'Zoneless',       value: s.zonelessEnabled,        tooltip: 'Angular Zoneless' },
      { label: 'Signals',        value: s.signalsUsed,            tooltip: 'Angular Signals' },
    ];
  });

  readonly findingCategories = computed(() => {
    const findings = this.scan()?.findings ?? [];
    const categories = [...new Set(findings.map(f => f.category))];
    return categories.map(cat => ({
      label: cat,
      value: cat,
      count: findings.filter(f => f.category === cat).length,
    }));
  });

  readonly filteredFindings = computed(() => {
    const findings = this.scan()?.findings ?? [];
    const cat = this.activeCategory();
    return cat ? findings.filter(f => f.category === cat) : findings;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.scanService.getScan(id).subscribe({
      next: scan => {
        this.scan.set(scan);
        this.loading.set(false);
        if (scan.status === 'PENDING' || scan.status === 'SCANNING') {
          this.scanService.pollScanStatus(id);
          // Re-subscribe to scan updates from service
          const checkInterval = setInterval(() => {
            const updated = this.scanService.scans().find(s => s.id === id);
            if (updated) {
              this.scan.set(updated);
              if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
                clearInterval(checkInterval);
              }
            }
          }, 2000);
        }
      },
      error: () => {
        this.error.set('Scan niet gevonden of toegang geweigerd.');
        this.loading.set(false);
      }
    });
  }
}
