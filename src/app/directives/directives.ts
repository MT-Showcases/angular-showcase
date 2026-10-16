// COMPONENT TYPE: Container
// SECTION: Angular Basics
//
// ROLE:
// - Demonstrate Angular structural and attribute directives
// - Show @if, @for, @switch (modern control flow)
// - Provide examples of ngClass and ngStyle for dynamic styling
//
// PATTERNS USED:
// - Standalone component with modern control flow syntax
// - Educational examples with React equivalents for comparison
// - Simple state management with component properties
//
// NOTES FOR CONTRIBUTORS:
// - Focus on modern Angular control flow (@if, @for, @switch)
// - Keep examples simple and interactive
// - Include React equivalents in comments for cross-framework learning
// - Use Italian for user-facing descriptions


import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PageHeader } from '../page-header/page-header';

@Component({
  selector: 'app-directives',
  imports: [PageHeader],
  templateUrl: './directives.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './directives.scss',
})
export class Directives {
  // Built-in @if control flow
  showMessage = true;
  isLoggedIn = false;

  // Built-in @for control flow
  items = ['Mela', 'Banana', 'Arancia'];

  // ngClass
  isActive = false;

  // ngStyle
  textColor = '#000000';

  toggleMessage() {
    this.showMessage = !this.showMessage;
  }

  toggleLogin() {
    this.isLoggedIn = !this.isLoggedIn;
  }

  toggleActive() {
    this.isActive = !this.isActive;
  }

  changeColor(color: string) {
    this.textColor = color;
  }
}
