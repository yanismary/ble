import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'scan',
    loadComponent: () =>
      import('./pages/scan/scan.page').then((m) => m.ScanPage),
  },
  {
    path: 'help',
    loadComponent: () =>
      import('./pages/help/help.page').then((m) => m.HelpPage),
  },
  {
    path: 'tutorial',
    loadComponent: () =>
      import('./pages/tutorial/tutorial.page').then((m) => m.TutorialPage),
  },
  {
    path: 'product/widoor',
    data: { profile: 'widoor' },
    loadComponent: () =>
      import('./pages/product/product.page').then((m) => m.ProductPage),
  },
  {
    path: 'product/moventiv-60',
    data: { profile: 'moventiv-60' },
    loadComponent: () =>
      import('./pages/product/product.page').then((m) => m.ProductPage),
  },
  {
    path: 'product/moventiv-80',
    data: { profile: 'moventiv-80' },
    loadComponent: () =>
      import('./pages/product/product.page').then((m) => m.ProductPage),
  },
  {
    path: 'product/garline',
    data: { profile: 'garline' },
    loadComponent: () =>
      import('./pages/product/product.page').then((m) => m.ProductPage),
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
