// COMPONENT TYPE: Container
// SECTION: Navigation and Layout
//
// ROLE:
// - Provide main application navigation
// - Organize navigation items into logical groups
// - Handle dropdown menu state and interactions
// - Track current route for active link highlighting
//
// PATTERNS USED:
// - Signal-based dropdown state management
// - Router integration for navigation and route tracking
// - Grouped navigation structure (Basics, Advanced, State Management, Examples)
// - HostListener for click-outside-to-close functionality
//
// NOTES FOR CONTRIBUTORS:
// - Add new routes to appropriate groups array
// - Maintain consistent icon usage with Icon component
// - Keep navigation structure flat (avoid deep nesting)
// - Update currentUrl signal when adding route tracking features

import { Component, signal, inject, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';

import { Icon } from '../components/icon/icon';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PATTERN: Navigation data structure
// PURPOSE:
// - Defines typed structure for navigation items and groups
// - Ensures consistency in navigation data throughout the component
// - Makes it easy to add new routes with type safety
interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Icon],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navbar.scss',
})
export class Navbar {
  private router = inject(Router);
  openDropdown = signal<string | null>(null);
  currentUrl = signal<string>('');

  mainItems: NavItem[] = [{ label: 'Home', route: '', icon: 'home', exact: true }];

  groups: NavGroup[] = [
    {
      label: 'Basi',
      icon: 'data-binding',
      items: [
        { label: 'Data Binding', route: '/basics/data-binding', icon: 'data-binding' },
        { label: 'Directives', route: '/basics/directives', icon: 'directives' },
        { label: 'Forms', route: '/basics/forms', icon: 'form' },
      ],
    },
    {
      label: 'Avanzato',
      icon: 'signals',
      items: [
        { label: 'Signals', route: '/advanced/signals', icon: 'signals' },
        { label: 'HTTP', route: '/advanced/http', icon: 'http' },
      ],
    },
    {
      label: 'Stato',
      icon: 'store',
      items: [
        { label: 'BehaviorSubject', route: '/state/behavior-subject', icon: 'signals' },
        { label: 'NgRx', route: '/state/ngrx', icon: 'store' },
      ],
    },
    {
      label: 'Esempi',
      icon: 'users',
      items: [
        { label: 'Lista utenti', route: '/examples/users', icon: 'users' },
        { label: 'Design system', route: '/design-system', icon: 'palette' },
      ],
    },
  ];

  constructor() {
    // Track current route
    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.closeDropdown();
      });
  }

  isGroupActive(group: NavGroup): boolean {
    const url = this.currentUrl();
    return group.items.some((item) => url.startsWith(item.route));
  }

  toggleDropdown(groupLabel: string) {
    this.openDropdown.set(this.openDropdown() === groupLabel ? null : groupLabel);
  }

  closeDropdown() {
    this.openDropdown.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeDropdown();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.nav-dropdown');

    if (!clickedInside && this.openDropdown()) {
      this.closeDropdown();
    }
  }
}
