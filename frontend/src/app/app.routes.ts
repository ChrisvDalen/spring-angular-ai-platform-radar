import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard — Platform Radar'
  },
  {
    path: 'scan',
    loadComponent: () =>
      import('./features/scan/scan-form.component').then(m => m.ScanFormComponent),
    title: 'Nieuwe Scan — Platform Radar'
  },
  {
    path: 'scans/:id',
    loadComponent: () =>
      import('./features/scan/scan-detail.component').then(m => m.ScanDetailComponent),
    title: 'Scan Detail — Platform Radar'
  },
  {
    path: 'scans/:id/advice',
    loadComponent: () =>
      import('./features/advice/advice.component').then(m => m.AdviceComponent),
    title: 'AI Advies — Platform Radar'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
