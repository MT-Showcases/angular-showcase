import { Component, signal, inject, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Icon } from '../components/icon/icon';
import { filter } from 'rxjs';

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
  imports: [RouterLink, RouterLinkActive, Icon, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private router = inject(Router);
  openDropdown = signal<string | null>(null);
  currentUrl = signal<string>('');

  mainItems: NavItem[] = [{ label: 'Home', route: '', icon: 'home', exact: true }];

  groups: NavGroup[] = [
    {
      label: 'Basics',
      icon: 'data-binding',
      items: [
        { label: 'Data Binding', route: '/basics/data-binding', icon: 'data-binding' },
        { label: 'Directives', route: '/basics/directives', icon: 'directives' },
        { label: 'Forms', route: '/basics/forms', icon: 'form' },
      ],
    },
    {
      label: 'Advanced',
      icon: 'signals',
      items: [
        { label: 'Signals', route: '/advanced/signals', icon: 'signals' },
        { label: 'HTTP', route: '/advanced/http', icon: 'http' },
      ],
    },
    {
      label: 'State',
      icon: 'store',
      items: [
        { label: 'BehaviorSubject', route: '/state/behavior-subject', icon: 'signals' },
        { label: 'NgRx', route: '/state/ngrx', icon: 'store' },
      ],
    },
    {
      label: 'Examples',
      icon: 'users',
      items: [{ label: 'Users List', route: '/examples/users', icon: 'users' }],
    },
  ];

  constructor() {
    // Traccia la route corrente
    this.currentUrl.set(this.router.url);

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.nav-dropdown');

    if (!clickedInside && this.openDropdown()) {
      this.closeDropdown();
    }
  }
}
