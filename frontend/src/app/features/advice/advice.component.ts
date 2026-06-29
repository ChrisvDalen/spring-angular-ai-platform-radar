import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { ScanService } from '../../core/services/scan.service';
import { AdviceResponse } from '../../core/models/scan.model';

@Component({
  selector: 'radar-advice',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    NgClass,
  ],
  template: `
    <div class="advice-page slide-up">
      @if (loading()) {
        <div class="center-state">
          <div class="ai-thinking">
            <mat-icon class="pulse">psychology</mat-icon>
            <mat-spinner diameter="48" />
          </div>
          <h3>AI analyseert je repository...</h3>
          <p>Claude genereert gepersonaliseerd advies op basis van je scan.</p>
        </div>
      } @else if (advice()) {
        <header class="advice-header">
          <button mat-icon-button [routerLink]="['/scans', scanId()]" matTooltip="Terug naar scan">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>AI Advies</h1>
            <p class="subtitle">Gegenereerd door Spring AI · Claude</p>
          </div>
          <a mat-stroked-button [href]="scanService.getReportUrl(scanId())" download>
            <mat-icon>download</mat-icon>
            Rapport (.md)
          </a>
        </header>

        <!-- Career Score -->
        <div class="career-banner" [ngClass]="'grade-' + advice()!.careerScore">
          <div class="career-grade">{{ advice()!.careerScore }}</div>
          <div class="career-info">
            <strong>Portfolio Score</strong>
            <p>{{ advice()!.careerNotes }}</p>
          </div>
          <mat-icon class="career-icon">workspace_premium</mat-icon>
        </div>

        <!-- AI Summary -->
        <div class="summary-card">
          <div class="summary-icon">
            <mat-icon>psychology</mat-icon>
          </div>
          <div class="summary-content">
            <h3>Samenvatting</h3>
            <p>{{ advice()!.summary }}</p>
          </div>
        </div>

        <!-- Quick Wins -->
        @if (advice()!.quickWins.length) {
          <section class="advice-section">
            <div class="section-header">
              <mat-icon class="section-icon wins">bolt</mat-icon>
              <div>
                <h2>Quick Wins</h2>
                <p>Verbeteringen die je snel kunt doorvoeren (&lt;2 uur)</p>
              </div>
            </div>
            <div class="action-list">
              @for (action of advice()!.quickWins; track action.action; let i = $index) {
                <div class="action-card">
                  <div class="action-number">{{ i + 1 }}</div>
                  <div class="action-content">
                    <div class="action-top">
                      <span class="priority-badge" [ngClass]="'pri-' + action.priority">
                        {{ action.priority }}
                      </span>
                      <strong>{{ action.action }}</strong>
                    </div>
                    <p class="action-rationale">{{ action.rationale }}</p>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- Upgrade Path -->
        @if (advice()!.upgradePath.length) {
          <section class="advice-section">
            <div class="section-header">
              <mat-icon class="section-icon upgrade">trending_up</mat-icon>
              <div>
                <h2>Upgrade Pad</h2>
                <p>Grotere moderniseringstappen voor enterprise-readiness</p>
              </div>
            </div>
            <div class="action-list">
              @for (action of advice()!.upgradePath; track action.action; let i = $index) {
                <div class="action-card">
                  <div class="action-number">{{ i + 1 }}</div>
                  <div class="action-content">
                    <div class="action-top">
                      <span class="priority-badge" [ngClass]="'pri-' + action.priority">
                        {{ action.priority }}
                      </span>
                      <strong>{{ action.action }}</strong>
                    </div>
                    <p class="action-rationale">{{ action.rationale }}</p>
                  </div>
                </div>
              }
            </div>
          </section>
        }
      } @else if (error()) {
        <div class="center-state error">
          <mat-icon>error_outline</mat-icon>
          <h3>Advies niet beschikbaar</h3>
          <p>{{ error() }}</p>
          <button mat-flat-button [routerLink]="['/scans', scanId()]">Terug naar scan</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .advice-page {
      padding: 32px;
      max-width: 900px;
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
      text-align: center;

      h3 { font-size: 20px; font-weight: 600; margin: 0; color: var(--radar-text); }
      p  { margin: 0; }

      &.error mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ef4444; }
    }

    .ai-thinking {
      position: relative;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        position: absolute;
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #60a5fa;
        z-index: 1;
      }

      mat-spinner { position: absolute; }
    }

    .advice-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 32px;

      div { flex: 1; }
      h1  { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
      .subtitle { font-size: 12px; color: var(--radar-text-secondary); margin: 0; }
    }

    .career-banner {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      border: 1px solid transparent;

      &.grade-A { background: rgba(34, 197, 94, 0.1);  border-color: rgba(34, 197, 94, 0.3); }
      &.grade-B { background: rgba(132, 204, 22, 0.1); border-color: rgba(132, 204, 22, 0.3); }
      &.grade-C { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); }
      &.grade-D { background: rgba(239, 68, 68, 0.1);  border-color: rgba(239, 68, 68, 0.3); }
    }

    .career-grade {
      font-size: 48px;
      font-weight: 900;
      width: 60px;
      text-align: center;
      line-height: 1;
    }

    .career-info {
      flex: 1;

      strong { font-size: 16px; display: block; margin-bottom: 4px; }
      p { font-size: 14px; color: var(--radar-text-secondary); margin: 0; }
    }

    .career-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      opacity: 0.5;
    }

    .summary-card {
      display: flex;
      gap: 16px;
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;

      .summary-icon {
        width: 40px;
        height: 40px;
        background: rgba(96, 165, 250, 0.1);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        mat-icon { color: #60a5fa; }
      }

      h3 { font-size: 14px; font-weight: 600; margin: 0 0 8px; color: var(--radar-text-secondary); }
      p  { font-size: 15px; color: var(--radar-text); line-height: 1.7; margin: 0; }
    }

    .advice-section {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;

      h2  { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
      p   { font-size: 13px; color: var(--radar-text-secondary); margin: 0; }
    }

    .section-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-top: 2px;

      &.wins    { color: #f59e0b; }
      &.upgrade { color: #22c55e; }
    }

    .action-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .action-card {
      display: flex;
      gap: 16px;
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 10px;
      padding: 16px 20px;
      transition: border-color 0.15s;

      &:hover { border-color: rgba(96, 165, 250, 0.3); }
    }

    .action-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--radar-surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      color: var(--radar-text-secondary);
      flex-shrink: 0;
    }

    .action-content { flex: 1; }

    .action-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      strong { font-size: 14px; font-weight: 600; color: var(--radar-text); }
    }

    .priority-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;

      &.pri-HIGH   { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
      &.pri-MEDIUM { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
      &.pri-LOW    { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    }

    .action-rationale {
      font-size: 13px;
      color: var(--radar-text-secondary);
      margin: 0;
      line-height: 1.5;
    }
  `]
})
export class AdviceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly scanService = inject(ScanService);

  readonly advice = signal<AdviceResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly scanId = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.scanId.set(id);

    this.scanService.getAdvice(id).subscribe({
      next: advice => {
        this.advice.set(advice);
        this.loading.set(false);
      },
      error: err => {
        this.error.set('Advies kon niet worden geladen. Zorg dat de scan voltooid is.');
        this.loading.set(false);
      }
    });
  }
}
