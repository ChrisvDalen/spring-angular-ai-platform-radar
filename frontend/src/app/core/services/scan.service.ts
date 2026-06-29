import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, interval, switchMap, takeWhile, tap, catchError, throwError, startWith } from 'rxjs';
import { AdviceResponse, Scan, ScanRequest, ScanStatus } from '../models/scan.model';

const API_BASE = '/api';

@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly http = inject(HttpClient);

  readonly scans = signal<Scan[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly pendingScans = computed(() =>
    this.scans().filter(s => s.status === 'PENDING' || s.status === 'SCANNING')
  );

  readonly completedScans = computed(() =>
    this.scans().filter(s => s.status === 'COMPLETED')
  );

  readonly avgHealthScore = computed(() => {
    const completed = this.completedScans();
    if (completed.length === 0) return null;
    const sum = completed.reduce((acc, s) => acc + (s.healthScore ?? 0), 0);
    return Math.round(sum / completed.length);
  });

  loadAllScans(): void {
    this.loading.set(true);
    this.http.get<Scan[]>(`${API_BASE}/scans`).pipe(
      tap(scans => {
        this.scans.set(scans);
        this.loading.set(false);
      }),
      catchError(err => {
        this.error.set(this.extractError(err));
        this.loading.set(false);
        return throwError(() => err);
      })
    ).subscribe();
  }

  startScan(request: ScanRequest): Observable<Scan> {
    return this.http.post<Scan>(`${API_BASE}/scans`, request).pipe(
      tap(newScan => {
        this.scans.update(scans => [newScan, ...scans]);
        this.pollScanStatus(newScan.id);
      }),
      catchError(err => throwError(() => this.extractError(err)))
    );
  }

  getScan(id: string): Observable<Scan> {
    return this.http.get<Scan>(`${API_BASE}/scans/${id}`);
  }

  getAdvice(id: string): Observable<AdviceResponse> {
    return this.http.get<AdviceResponse>(`${API_BASE}/scans/${id}/advice`);
  }

  getReportUrl(id: string): string {
    return `${API_BASE}/scans/${id}/report.md`;
  }

  pollScanStatus(id: string): void {
    const terminalStatuses: ScanStatus[] = ['COMPLETED', 'FAILED'];

    interval(3000).pipe(
      startWith(0),
      switchMap(() => this.http.get<Scan>(`${API_BASE}/scans/${id}`)),
      tap(scan => {
        this.scans.update(scans =>
          scans.map(s => s.id === id ? scan : s)
        );
      }),
      takeWhile(scan => !terminalStatuses.includes(scan.status), true)
    ).subscribe();
  }

  private extractError(err: HttpErrorResponse | unknown): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.detail ?? err.error?.message ?? `HTTP ${err.status}: ${err.statusText}`;
    }
    return 'Er is een onbekende fout opgetreden.';
  }
}
