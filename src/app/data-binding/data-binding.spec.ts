import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DataBinding } from './data-binding';
import { BINDING_EXAMPLE } from './binding.example';
import { BINDING_DIAGRAM } from './data-binding-diagrams';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { By } from '@angular/platform-browser';

describe('DataBinding playground lesson', () => {
  it('connects the actual lesson seed to a visible editor before optional theory', async () => {
    TestBed.configureTestingModule({ imports: [DataBinding], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DataBinding);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
    expect(playground.initial()).toBe(BINDING_EXAMPLE);
    expect(page.querySelector('.lesson-shell__intro')).toBeNull();
    expect(page.querySelectorAll('.cm-editor')).toHaveLength(3);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
    expect(page.querySelector('app-angular-playground')!.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fixture.destroy();
  });

  it('places the binding schema after the editor and opens the event source from a node', async () => {
    TestBed.configureTestingModule({ imports: [DataBinding], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DataBinding);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const source = page.querySelector('#code')!;
    const diagram = page.querySelector('app-lesson-diagram')!;

    expect(source.compareDocumentPosition(diagram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(diagram.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(diagram.textContent).toContain(BINDING_DIAGRAM.title);

    const node = [...page.querySelectorAll<HTMLButtonElement>('.diagram__node')]
      .find(button => button.getAttribute('aria-label') === 'Apri Evento nella vista, file component.html')!;
    node.click();
    await fixture.whenStable();

    const selected = page.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')!;
    expect(selected.textContent?.trim()).toBe('component.html');
    fixture.destroy();
  });
});
