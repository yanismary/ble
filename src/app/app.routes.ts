import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'scan',
    loadComponent: () =>
      import('./pages/scan/scan.page').then((m) => m.ScanPage),
  },
  {
    path: '',
    redirectTo: 'scan',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'scan',
  },
];
