// COMPONENT TYPE: Presentational
// SECTION: Shared UI Components
//
// ROLE:
// - Render SVG icons by name
// - Provide centralized icon registry
// - Enable consistent icon usage across the application
//
// PATTERNS USED:
// - Pure presentational component (@Input only)
// - Template-based icon switching (@switch in HTML)
// - SVG inline rendering for performance and styling flexibility
//
// NOTES FOR CONTRIBUTORS:
// - Add new icons directly in the icon.html template
// - Use currentColor for SVG fill to inherit parent text color
// - Keep icon names lowercase and kebab-case
// - All icons should be 24x24 viewBox for consistency

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-icon',
  imports: [],
  templateUrl: './icon.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './icon.scss',
})
export class Icon {
  // The @Input name specifies which icon to render
  // Example: <app-icon name="users" /> will render the users icon
  @Input() name!: string;
}
