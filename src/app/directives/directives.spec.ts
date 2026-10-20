import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Directives } from './directives';
import { DIRECTIVE_EXAMPLE, FOR_EXAMPLE, IF_EXAMPLE, SWITCH_EXAMPLE } from './control-flow.example';
import { DIRECTIVE_DIAGRAM, FOR_DIAGRAM, IF_DIAGRAM, SWITCH_DIAGRAM } from './directives-diagrams';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { By } from '@angular/platform-browser';

describe('Directives playground lesson', () => {
  it('connects the actual lesson seed to a visible editor before optional theory', async () => {
    TestBed.configureTestingModule({ imports: [Directives], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Directives);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
    expect(playground.initial()).toBe(IF_EXAMPLE);
    expect(page.querySelector('.lesson-shell__intro')).toBeNull();
    expect(page.querySelectorAll('.cm-editor')).toHaveLength(3 + Object.keys(playground.initial().files ?? {}).length);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
    expect(page.querySelector('app-angular-playground')!.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fixture.destroy();
  });

  it('selects the matching schema for every example and links only real files', async () => {
    TestBed.configureTestingModule({ imports: [Directives], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Directives);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');
    const cases = [
      { seed: IF_EXAMPLE, schema: IF_DIAGRAM },
      { seed: FOR_EXAMPLE, schema: FOR_DIAGRAM },
      { seed: SWITCH_EXAMPLE, schema: SWITCH_DIAGRAM },
      { seed: DIRECTIVE_EXAMPLE, schema: DIRECTIVE_DIAGRAM },
    ];

    expect(choices).toHaveLength(cases.length);

    for (const [index, testCase] of cases.entries()) {
      choices[index].click();
      await fixture.whenStable();

      const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
      const diagram = page.querySelector('app-lesson-diagram')!;
      expect(playground.initial()).toBe(testCase.seed);
      expect(diagram.textContent).toContain(testCase.schema.title);
      expect(diagram.querySelectorAll('.diagram__group')).toHaveLength(testCase.schema.groups.length);

      const files = new Set(playground.files.map(file => file.name));
      for (const node of diagram.querySelectorAll('.diagram__node')) {
        const target = node.querySelector('.diagram__node-file')?.textContent?.trim();
        expect(files.has(target!)).toBe(true);
      }
    }

    fixture.destroy();
  });
});
