// COMPONENT TYPE: Container
// SECTION: Angular Basics
//
// ROLE:
// - Demonstrate core Angular data binding concepts
// - Show interpolation, property binding, and event binding
// - Provide interactive examples for each binding type
//
// PATTERNS USED:
// - Standalone component architecture
// - Educational organization with clear examples
// - Direct state manipulation (no services needed for basic demo)
//
// NOTES FOR CONTRIBUTORS:
// - Keep examples simple and focused on binding concepts
// - Add comments explaining Angular vs React equivalents for learning
// - Use clear section markers for different binding types
// - Maintain Italian for user-facing content


import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PageHeader } from '../page-header/page-header';

@Component({
  selector: 'app-data-binding',
  imports: [PageHeader],
  templateUrl: './data-binding.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './data-binding.scss',
})
export class DataBinding {
  // Simple property - used with interpolation {{ text }}
  text = 'testo statico da variabile';

  // Mutable property - modified by events
  // In React: const [imgLogo, setImgLogo] = useState('/logo.png')
  imgLogo = '/logo.png';

  // Simple method - called in template: {{ getText() }}
  getText() {
    return 'testo da getText()';
  }

  // Method with parameters - example: {{ getDynamicText('test') }}
  getDynamicText(text: string) {
    return 'dynamic text: ' + text;
  }

  // Method with multiple parameters - example: {{ sum(2, 3) }}
  sum(a: number, b: number) {
    return a + b;
  }

  trackByUserId(_: number, user: any) {
    return user.id;
  }

  // GETTER: access imgLogo as property
  // Usable in template: {{ imgLogoSrc }} or [src]="imgLogoSrc"
  get imgLogoSrc() {
    return this.imgLogo;
  }

  // SETTER: modify imgLogo as property
  // In React getters/setters aren't needed, state is used directly
  set imgLogoSrc(value: string) {
    this.imgLogo = value;
  }

  // EVENT HANDLER: modify state on click
  // Angular: (click)="onClick()" - explicit call
  // React: onClick={onClick} - function reference
  onClick() {
    this.imgLogo = '/path-inesistente.png';
  }

  onReset() {
    this.imgLogo = '/logo.png';
  }
}
