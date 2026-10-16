// COMPONENT TYPE: Presentational
// SECTION: Shared UI Components
//
// ROLE:
// - Display an interactive feature card with 3D parallax hover effect
// - Show feature icon, title, description, and bullet points
// - Provide navigation through routerLink
//
// PATTERNS USED:
// - Pure presentational component (no business logic)
// - @Input() for all data, no @Output() needed (navigation via RouterLink)
// - Signal-based reactive transform for smooth 3D effect
// - Pointer tracking limited to the hovered card
//
// NOTES FOR CONTRIBUTORS:
// - Keep this component stateless and reusable
// - 3D effect parameters (MAX_ROTATION_DEGREES, perspective) can be tuned for different feel
// - Do not add data fetching or navigation logic here
// - All visual behavior should be CSS-based where possible

import { Component, Input, HostListener, signal, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-feature-card',
  imports: [RouterLink, Icon],
  templateUrl: './feature-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './feature-card.scss',
})
export class FeatureCard {
  // Maximum rotation in degrees for 3D parallax effect
  // Lower values = more subtle and natural effect
  private readonly MAX_ROTATION_DEGREES = 2;

  @Input() routerLink!: string;

  // iconName is the icon name to render (e.g. 'users', 'forms', etc.)
  // It is passed to the Icon component which handles rendering via @switch
  @Input() iconName!: string;

  @Input() title!: string;
  @Input() description!: string;
  @Input() features!: string[];

  // Keep the transform neutral until the pointer enters this card.
  transform = signal('none');

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  @HostListener('mouseleave')
  onMouseLeave() {
    this.transform.set('none');
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = Math.max(
      -1,
      Math.min(1, (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)),
    );
    const y = Math.max(
      -1,
      Math.min(1, (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)),
    );
    this.transform.set(
      `perspective(1000px) rotateX(${-y * this.MAX_ROTATION_DEGREES}deg) rotateY(${x * this.MAX_ROTATION_DEGREES}deg) scale(1.02)`,
    );
  }
}
