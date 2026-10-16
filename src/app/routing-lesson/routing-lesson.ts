// COMPONENT TYPE: Container
// SECTION: Angular Basics
// ROLE: Keep lesson context mounted while nested demo routes change.
// PATTERNS USED: Nested outlet, relative navigation and reactive query/URL state.
// NOTES FOR CONTRIBUTORS: Keep every demo destination under this parent; root routes are coordinator-owned.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';

@Component({
  selector: 'app-routing-lesson',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatButtonModule, CodeBlock, LessonDisclosure, LessonShell],
  templateUrl: './routing-lesson.html',
  styleUrl: './routing-lesson.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutingLesson {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly compact = computed(() => this.query().get('mode') === 'compact');
  readonly reminders = signal(0);
  readonly currentUrl = toSignal(this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map(() => this.router.url),
  ), { initialValue: this.router.url });

  readonly rootCode = `// Application routes — the parent owns the lesson shell.
import { Routes } from '@angular/router';

export const routes: Routes = [{
  path: 'basics',
  children: [{
    path: 'routing',
    loadComponent: () => import('./routing-lesson/routing-lesson')
      .then(m => m.RoutingLesson),
    loadChildren: () => import('./routing-lesson/demo.routes')
      .then(m => m.DEMO_ROUTES),
  }],
}];
// Application configuration: provideRouter(routes).
// The application template also needs its own <router-outlet />.`;
  readonly childCode = `// routing-lesson/demo.routes.ts
import { Routes } from '@angular/router';
import { DemoOverview, DemoDetail, DemoNotFound } from './demo-views';

export const DEMO_ROUTES: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  { path: 'overview', component: DemoOverview },
  { path: 'detail/:id', component: DemoDetail },
  { path: '**', component: DemoNotFound },
];`;
  readonly templateCode = `<!-- Parent template: imports RouterLink and RouterOutlet. -->
<a [routerLink]="['detail', 1]" [queryParams]="{ mode: 'compact' }">
  Apri il dettaglio 1 in modalità compatta
</a>
<router-outlet />
<!-- Only the child view changes inside the lesson. -->`;
  readonly paramCode = `// Inside DemoDetail: imports from @angular/core,
// @angular/core/rxjs-interop and @angular/router.
private readonly route = inject(ActivatedRoute);
private readonly params = toSignal(this.route.paramMap, {
  initialValue: this.route.snapshot.paramMap,
});
readonly id = computed(() => this.params().get('id'));
// Template: {{ id() }}
// toSignal cleans up its subscription when the component is destroyed.
// A snapshot alone would not react to a second ID in the same component.`;
  readonly queryCode = `// Inside the parent lesson; route is its ActivatedRoute.
this.router.navigate([], {
  relativeTo: this.route.firstChild ?? this.route,
  queryParams: { mode: 'compact' },
  queryParamsHandling: 'merge',
});
// Keep the current child path and update only this query parameter.`;

  incrementReminder(): void {
    this.reminders.update(count => count + 1);
  }

  toggleMode(): void {
    void this.router.navigate([], {
      relativeTo: this.route.firstChild ?? this.route,
      queryParams: { mode: this.compact() ? null : 'compact' },
      queryParamsHandling: 'merge',
    });
  }

  reset(): void {
    this.reminders.set(0);
    void this.router.navigate(['overview'], { relativeTo: this.route, queryParams: {} });
  }
}
