import { TestBed } from '@angular/core/testing';
import { LessonInline } from './lesson-inline';

describe('LessonInline', () => {
  it('renders bold and code natively while keeping whitespace and HTML-looking text', () => {
    TestBed.configureTestingModule({ imports: [LessonInline] });
    const fixture = TestBed.createComponent(LessonInline);
    fixture.componentRef.setInput('text', 'Usa  **@if** con `visible` e <b>testo</b>.\nGrazie');
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('strong')?.textContent).toBe('@if');
    expect(page.querySelector('code')?.textContent).toBe('visible');
    expect(page.querySelector('b')).toBeNull();
    expect(page.textContent).toBe('Usa  @if con visible e <b>testo</b>.\nGrazie');
  });

  it('updates with the input and leaves unmatched delimiters literal', () => {
    TestBed.configureTestingModule({ imports: [LessonInline] });
    const fixture = TestBed.createComponent(LessonInline);
    fixture.componentRef.setInput('text', 'Testo **non chiuso e `codice');
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;

    expect(page.querySelector('strong, code')).toBeNull();
    expect(page.textContent).toBe('Testo **non chiuso e `codice');

    fixture.componentRef.setInput('text', 'Ora **forte** e `codice`');
    fixture.detectChanges();
    expect(page.querySelector('strong')?.textContent).toBe('forte');
    expect(page.querySelector('code')?.textContent).toBe('codice');
    expect(page.textContent).toBe('Ora forte e codice');
  });

  it('leaves plain strings unchanged', () => {
    TestBed.configureTestingModule({ imports: [LessonInline] });
    const fixture = TestBed.createComponent(LessonInline);
    fixture.componentRef.setInput('text', 'Nessuna formattazione.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('Nessuna formattazione.');
  });
});
