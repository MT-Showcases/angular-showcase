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

import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
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
  protected readonly title = signal('angular-showcase');
}
