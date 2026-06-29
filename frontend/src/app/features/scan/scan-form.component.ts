import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ScanService } from '../../core/services/scan.service';

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/;

const EXAMPLE_REPOS = [
  'https://github.com/spring-projects/spring-boot',
  'https://github.com/angular/angular',
  'https://github.com/spring-projects/spring-framework',
];

@Component({
  selector: 'radar-scan-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  template: `
    <div class="scan-page slide-up">
      <div class="scan-container">
        <header class="scan-header">
          <mat-icon class="header-icon">search</mat-icon>
          <h1>Scan je GitHub Repo</h1>
          <p>Voer een publieke GitHub-URL in. We scannen versies, dependencies en geeft AI-advies.</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="scan-form">
          <mat-form-field appearance="outline" class="url-field">
            <mat-label>GitHub Repository URL</mat-label>
            <mat-icon matPrefix>link</mat-icon>
            <input
              matInput
              formControlName="repoUrl"
              placeholder="https://github.com/owner/repo"
              autocomplete="off"
            />
            @if (form.get('repoUrl')?.errors?.['required'] && form.get('repoUrl')?.touched) {
              <mat-error>URL is verplicht</mat-error>
            }
            @if (form.get('repoUrl')?.errors?.['pattern'] && form.get('repoUrl')?.touched) {
              <mat-error>Voer een geldige GitHub-URL in (https://github.com/owner/repo)</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="branch-field">
            <mat-label>Branch (optioneel)</mat-label>
            <mat-icon matPrefix>account_tree</mat-icon>
            <input matInput formControlName="branch" placeholder="main" />
          </mat-form-field>

          @if (error()) {
            <div class="error-banner">
              <mat-icon>error_outline</mat-icon>
              {{ error() }}
            </div>
          }

          @if (loading()) {
            <div class="loading-section">
              <mat-progress-bar mode="indeterminate" />
              <p class="loading-text">Scan gestart — analyseren van repository...</p>
            </div>
          }

          <div class="form-actions">
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || loading()"
              class="submit-btn"
            >
              @if (loading()) {
                <mat-icon>hourglass_empty</mat-icon>
                Scanning...
              } @else {
                <mat-icon>radar</mat-icon>
                Start Scan
              }
            </button>
          </div>
        </form>

        <div class="examples-section">
          <p class="examples-label">Probeer een voorbeeld:</p>
          <div class="example-chips">
            @for (repo of exampleRepos; track repo) {
              <button
                mat-stroked-button
                class="example-chip"
                (click)="fillExample(repo)"
                [disabled]="loading()"
              >
                {{ repo.replace('https://github.com/', '') }}
              </button>
            }
          </div>
        </div>

        <div class="what-we-scan">
          <h3>Wat scannen we?</h3>
          <div class="scan-items">
            @for (item of scanItems; track item.label) {
              <div class="scan-item">
                <mat-icon [class]="item.iconClass">{{ item.icon }}</mat-icon>
                <div>
                  <strong>{{ item.label }}</strong>
                  <span>{{ item.description }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scan-page {
      padding: 32px;
      min-height: 100%;
      display: flex;
      justify-content: center;
    }

    .scan-container {
      width: 100%;
      max-width: 680px;
    }

    .scan-header {
      text-align: center;
      margin-bottom: 40px;

      .header-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #60a5fa;
        margin-bottom: 12px;
      }

      h1 {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 8px;
        color: var(--radar-text);
      }

      p {
        color: var(--radar-text-secondary);
        margin: 0;
      }
    }

    .scan-form {
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .url-field, .branch-field {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field {
      .mat-mdc-text-field-wrapper {
        background: var(--radar-surface-2) !important;
      }
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: #ef4444;
      font-size: 14px;
    }

    .loading-section {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .loading-text {
        font-size: 13px;
        color: var(--radar-text-secondary);
        margin: 0;
        text-align: center;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .submit-btn {
      height: 44px;
      padding: 0 24px;
      font-size: 15px;
      font-weight: 600;
    }

    .examples-section {
      margin-bottom: 32px;

      .examples-label {
        font-size: 13px;
        color: var(--radar-text-secondary);
        margin: 0 0 10px;
      }

      .example-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .example-chip {
        font-size: 12px;
        color: var(--radar-text-secondary);
        border-color: var(--radar-border);
        border-radius: 9999px;

        &:hover:not(:disabled) {
          color: #60a5fa;
          border-color: rgba(96, 165, 250, 0.4);
        }
      }
    }

    .what-we-scan {
      h3 {
        font-size: 14px;
        font-weight: 600;
        color: var(--radar-text-secondary);
        margin: 0 0 16px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .scan-items {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .scan-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: var(--radar-surface);
      border: 1px solid var(--radar-border);
      border-radius: 8px;

      mat-icon { opacity: 0.8; flex-shrink: 0; }
      .icon-blue   { color: #60a5fa; }
      .icon-green  { color: #22c55e; }
      .icon-yellow { color: #f59e0b; }
      .icon-purple { color: #a78bfa; }
      .icon-red    { color: #f87171; }
      .icon-teal   { color: #2dd4bf; }

      div {
        display: flex;
        flex-direction: column;
        gap: 2px;

        strong { font-size: 13px; font-weight: 600; color: var(--radar-text); }
        span   { font-size: 11px; color: var(--radar-text-secondary); }
      }
    }
  `]
})
export class ScanFormComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly scanService = inject(ScanService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly exampleRepos = EXAMPLE_REPOS;

  readonly form = this.fb.group({
    repoUrl: ['', [Validators.required, Validators.pattern(GITHUB_URL_PATTERN)]],
    branch: ['main'],
  });

  readonly scanItems = [
    { icon: 'coffee', iconClass: 'icon-blue',   label: 'Java / Spring Boot', description: 'Versie, EOL-status, security' },
    { icon: 'web',    iconClass: 'icon-red',    label: 'Angular',             description: 'Versie, Signals, Zoneless' },
    { icon: 'lock',   iconClass: 'icon-yellow', label: 'Spring Security',     description: 'Configuratie & kwetsbaarheden' },
    { icon: 'build',  iconClass: 'icon-green',  label: 'Docker / CI/CD',      description: 'Dockerfile & GitHub Actions' },
    { icon: 'radar',  iconClass: 'icon-teal',   label: 'OpenTelemetry',       description: 'Tracing & observability' },
    { icon: 'shield', iconClass: 'icon-purple', label: 'Dependabot',          description: 'Dependency scanning' },
  ];

  fillExample(repo: string): void {
    this.form.patchValue({ repoUrl: repo });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const { repoUrl, branch } = this.form.value;
    this.scanService.startScan({ repoUrl: repoUrl!, branch: branch ?? 'main' }).subscribe({
      next: scan => {
        this.loading.set(false);
        this.router.navigate(['/scans', scan.id]);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(typeof err === 'string' ? err : 'Scan starten mislukt. Probeer opnieuw.');
      }
    });
  }
}
