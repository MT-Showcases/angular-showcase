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
// - Add new routes to sections.ts so hubs and navigation share one source
// - Use Angular Material icons for every navigation glyph
// - Keep navigation structure flat (avoid deep nesting)
// - Update currentUrl signal when adding route tracking features

import { Component, signal, inject, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CATEGORY_LIST } from '../learning/sections';

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
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './navbar.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './navbar.scss',
})
export class Navbar {
  private router = inject(Router);
  openDropdown = signal<string | null>(null);
  currentUrl = signal<string>('');

  mainItems: NavItem[] = [{ label: 'Home', route: '', icon: 'home', exact: true }];

  groups: NavGroup[] = CATEGORY_LIST.map((section) => ({
    label: section.navLabel,
    icon: section.navIcon,
    items: [
      {
        label: section.overviewLabel,
        route: `/${section.id}`,
        icon: section.overviewIcon,
      },
      ...section.resources.map((resource) => ({
        label: resource.title,
        route: resource.route,
        icon: resource.navIcon,
      })),
    ],
  }));

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
