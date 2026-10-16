import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GettingStarted } from './getting-started';

describe('First component playground lesson', () => {
  it('puts the executable preview and editable source before optional explanation', async () => {
    TestBed.configureTestingModule({ imports: [GettingStarted], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(GettingStarted);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('h1')?.textContent).toBe('Il primo componente');
    expect(page.querySelector('.lesson-shell__intro')).toBeNull();
    expect(page.querySelector('iframe')?.getAttribute('sandbox')).toBe('allow-scripts');
    expect(page.querySelectorAll('.cm-editor')).toHaveLength(3);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
    expect(page.querySelector('app-angular-playground')!.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fixture.destroy();
  });
});
