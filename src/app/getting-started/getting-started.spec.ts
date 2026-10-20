import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GettingStarted } from './getting-started';
import { FIRST_COMPONENT_DIAGRAM } from './getting-started-diagrams';

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

  it('places the initial schema after the editor and opens a source file from a node', async () => {
    TestBed.configureTestingModule({ imports: [GettingStarted], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(GettingStarted);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const source = page.querySelector('#code')!;
    const diagram = page.querySelector('app-lesson-diagram')!;

    expect(source.compareDocumentPosition(diagram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(diagram.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(diagram.textContent).toContain(FIRST_COMPONENT_DIAGRAM.title);

    const node = [...page.querySelectorAll<HTMLButtonElement>('.diagram__node')]
      .find(button => button.getAttribute('aria-label') === 'Apri Solo aspetto, file component.css')!;
    node.click();
    await fixture.whenStable();

    const selected = page.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')!;
    expect(selected.textContent?.trim()).toBe('component.css');
    fixture.destroy();
  });
});
