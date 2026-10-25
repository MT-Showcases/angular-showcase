// COMPONENT TYPE: Container
// SECTION: Application Root
//
// ROLE:
// - Serve as the root component of the entire application
// - Compose layout structure (navbar, router-outlet, modals)
// - Apply global directives (LinkInterceptor)
// - Manage top-level application concerns
//
// PATTERNS USED:
// - Root component pattern
// - Global composition (navbar, router, modals)
// - Directive application (LinkInterceptor for external links)
//
// NOTES FOR CONTRIBUTORS:
// - Keep this component minimal
// - Add only truly global concerns here
// - Feature-specific logic belongs in feature components
// - Router outlet renders feature components based on route

import { Component, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { BouncingLogo } from './bouncing-logo/bouncing-logo';
import { LinkModal } from './link-modal/link-modal';
import { LinkInterceptor } from '../directives/link-interceptor.directive';

@Component({
  selector: 'app-root',
  imports: [RouterModule, Navbar, BouncingLogo, LinkModal, LinkInterceptor],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.scss',
})
export class App {
  constructor() {
    // Router anchor scrolling uses coordinates, so CSS scroll-padding alone cannot clear the sticky navbar.
    // Match the shared 100px anchor clearance; CSS still controls smooth/reduced-motion behavior.
    inject(ViewportScroller).setOffset([0, 100]);
  }

  private readonly router = inject(Router);
  private readonly url = toSignal(this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(event => event.urlAfterRedirects)), { initialValue: this.router.url });
  readonly isLesson = computed(() => /^\/(basics|advanced|state|examples)\//.test(this.url()));
  readonly explorationOpen = signal(false);
  toggleExploration(event: Event): void { this.explorationOpen.set((event.target as HTMLDetailsElement).open); }
  protected readonly title = signal('angular-showcase');
}
