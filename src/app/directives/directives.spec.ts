import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Directives } from './directives';
import { IF_EXAMPLE } from './control-flow.example';
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
    expect(page.querySelectorAll('.cm-editor')).toHaveLength(3);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
    expect(page.querySelector('app-angular-playground')!.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fixture.destroy();
  });
});
