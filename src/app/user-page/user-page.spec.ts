// Host checks cover file navigation and drafts; HTTP behavior is tested in the preview.
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { EditorView } from '@codemirror/view';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { UserPage } from './user-page';

describe('Users editable project', () => {
  it('places the source-linked schema after the editor and preserves the preview on file selection', async () => {
    TestBed.configureTestingModule({ imports: [UserPage], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(UserPage);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const frame = page.querySelector('iframe');
    const diagram = page.querySelector('app-lesson-diagram')!;
    const code = page.querySelector('.cm-editor')!;
    expect(code.compareDocumentPosition(diagram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
    for (const name of Object.keys(playground.initial().files ?? {})) {
      const node = [...diagram.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.getAttribute('aria-label')?.endsWith(`file ${name}`));
      expect(node, `Missing schema file ${name}`).toBeTruthy();
      node!.click();
      await fixture.whenStable();
      expect(page.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe(name);
      expect(page.querySelector('iframe')).toBe(frame);
    }
    fixture.destroy();
  });

  it('keeps a service draft across file switches and restores the original code', async () => {
    TestBed.configureTestingModule({ imports: [UserPage], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(UserPage);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
    const name = Object.keys(playground.initial().files ?? {}).find(name => name.endsWith('.service.ts'))!;
    const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>(`[id$="editor-${name}"] .cm-editor`)!)!;
    const original = editor.state.doc.toString();
    editor.dispatch({ changes: { from: 0, insert: '// bozza locale\n' } });
    const tabs = [...page.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    tabs.find(tab => tab.textContent?.trim() === 'component.html')!.click();
    await fixture.whenStable();
    tabs.find(tab => tab.textContent?.trim() === name)!.click();
    await fixture.whenStable();
    expect(editor.state.doc.toString()).toBe('// bozza locale\n' + original);
    [...page.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Ripristina codice')!.click();
    await fixture.whenStable();
    expect(editor.state.doc.toString()).toBe(original);
    fixture.destroy();
  });
});
