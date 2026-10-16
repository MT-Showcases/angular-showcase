// COMPONENT TYPE: Test Suite
// SECTION: Angular Basics
// ROLE: Verify reusable attribute behavior without changing host content or semantics.
// PATTERNS USED: A small host component updates the directive's public input.
// NOTES FOR CONTRIBUTORS: Test both enabling and disabling the visual state.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LessonHighlight } from './lesson-highlight';

@Component({
  imports: [LessonHighlight],
  template: '<p class="existing" [appLessonHighlight]="enabled()">Una nota leggibile</p>',
})
class HighlightHost {
  enabled = signal(false);
}

describe('LessonHighlight', () => {
  it('toggles only its own host class and preserves text and existing classes', async () => {
    const fixture = TestBed.createComponent(HighlightHost);
    await fixture.whenStable();
    const paragraph: HTMLElement = fixture.nativeElement.querySelector('p');
    expect(paragraph.classList.contains('lesson-highlighted')).toBe(false);
    fixture.componentInstance.enabled.set(true);
    await fixture.whenStable();
    expect(paragraph.classList.contains('lesson-highlighted')).toBe(true);
    expect(paragraph.classList.contains('existing')).toBe(true);
    expect(paragraph.textContent).toBe('Una nota leggibile');
    fixture.componentInstance.enabled.set(false);
    await fixture.whenStable();
    expect(paragraph.classList.contains('lesson-highlighted')).toBe(false);
    expect(paragraph.getAttribute('role')).toBeNull();
  });
});
