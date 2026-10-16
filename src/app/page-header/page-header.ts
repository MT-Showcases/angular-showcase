// COMPONENT TYPE: Presentational
// SECTION: Layout Components
//
// ROLE:
// - Display consistent page header with title and subtitle
// - Provide standardized visual hierarchy for all pages
// - Keep page header styling centralized
//
// PATTERNS USED:
// - Pure presentational component (@Input only)
// - No business logic or state management
// - Reusable across all page-level components
//
// NOTES FOR CONTRIBUTORS:
// - Keep this component simple and stateless
// - All styling should be in page-header.scss
// - Used at the top of every major page/section

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-page-header',
  imports: [],
  templateUrl: './page-header.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './page-header.scss',
})
export class PageHeader {
  @Input() title = '';
  @Input() subtitle = '';
}
