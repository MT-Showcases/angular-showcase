// COMPONENT TYPE: Route Configuration
// SECTION: Angular Basics
// ROLE: Keep all training navigation inside the routing lesson's child outlet.
// PATTERNS USED: Full-match default redirect, parameter route and last-position local wildcard.
// NOTES FOR CONTRIBUTORS: Place the wildcard last; use the parent application route for lazy loading.
import { Routes } from '@angular/router';
import { DemoDetail, DemoNotFound, DemoOverview } from './demo-views';

export const DEMO_ROUTES: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview', component: DemoOverview },
  { path: 'detail/:id', component: DemoDetail },
  { path: '**', component: DemoNotFound },
];
