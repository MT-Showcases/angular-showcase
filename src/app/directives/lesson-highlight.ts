// COMPONENT TYPE: Attribute Directive
// SECTION: Angular Basics
// ROLE: Reuse an optional visual highlight without changing content or input behavior.
// PATTERNS USED: Signal input and declarative host class binding.
// NOTES FOR CONTRIBUTORS: Keep semantics on the host; announce state in the demo's status text.
import { Directive, input } from '@angular/core';

/** Applies the lesson's highlight class. @example <p [appLessonHighlight]="enabled">...</p> */
@Directive({
  selector: '[appLessonHighlight]',
  host: { '[class.lesson-highlighted]': 'appLessonHighlight()' },
})
export class LessonHighlight {
  readonly appLessonHighlight = input(false);
}
