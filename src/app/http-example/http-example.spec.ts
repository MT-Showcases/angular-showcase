// COMPONENT TYPE: Test Suite
// ROLE: Verify that the compact HTTP lesson wires four editable seeds, their drafts, tabs and diagrams.
// PATTERNS USED: Real lesson DOM, the active playground, the CodeMirror source and the example metadata.
// NOTES FOR CONTRIBUTORS: Runtime HTTP behavior belongs in scripts/test-http.mjs.
import { EditorView } from '@codemirror/view';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { HTTP_EXAMPLES } from './http.example';
import { HttpExample } from './http-example';

describe('HTTP playground lesson', () => {
  it('switches four seeds, keeps a service draft and resets the active seed', async () => {
    TestBed.configureTestingModule({ imports: [HttpExample], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HttpExample);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');

    expect(HTTP_EXAMPLES).toHaveLength(4);
    expect(choices).toHaveLength(4);
    expect(page.querySelector('app-lesson-diagram')).not.toBeNull();

    for (const [index, seed] of HTTP_EXAMPLES.entries()) {
      choices[index].click();
      await fixture.whenStable();

      const playground = fixture.debugElement
        .query(By.directive(AngularPlayground))
        .componentInstance as AngularPlayground;
      const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>('.cm-editor')!)!;

      expect(playground.initial()).toBe(seed.sources);
      expect(choices[index].getAttribute('aria-pressed')).toBe('true');
      expect(page.querySelectorAll('.cm-editor')).toHaveLength(3 + Object.keys(seed.sources.files ?? {}).length);
      expect(editor.state.doc.toString()).toBe(seed.sources.typescript);
      expect(page.textContent).toContain(seed.title);
    }

    choices[0].click();
    await fixture.whenStable();
    const serviceEditor = () => EditorView.findFromDOM(
      page.querySelector<HTMLElement>('[id$="editor-posts.service.ts"] .cm-editor')!,
    )!;
    const original = HTTP_EXAMPLES[0].sources.files!['posts.service.ts'];
    const modified = '// bozza locale\n' + original;

    serviceEditor().dispatch({
      changes: { from: 0, to: serviceEditor().state.doc.length, insert: modified },
    });
    choices[1].click();
    await fixture.whenStable();
    choices[0].click();
    await fixture.whenStable();

    expect(serviceEditor().state.doc.toString()).toBe(modified);

    [...page.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === 'Ripristina codice')!
      .click();
    await fixture.whenStable();

    expect(serviceEditor().state.doc.toString()).toBe(original);
    expect(HTTP_EXAMPLES[0].sources.files!['posts.service.ts']).toBe(original);

    fixture.destroy();
  });

  it('offers config and service tabs whose diagram targets stay editable and follow the editor', async () => {
    TestBed.configureTestingModule({ imports: [HttpExample], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(HttpExample);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');
    const expectedNames = ['component.ts', 'component.html', 'component.css', 'app.config.ts', 'posts.service.ts'];

    for (const [index, seed] of HTTP_EXAMPLES.entries()) {
      choices[index].click();
      await fixture.whenStable();

      const playground = fixture.debugElement
        .query(By.directive(AngularPlayground))
        .componentInstance as AngularPlayground;
      expect(playground.files.map(file => file.name)).toEqual(expectedNames);

      const tabs = () => [...page.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
      tabs().find(tab => tab.textContent?.trim() === 'app.config.ts')!.click();
      await fixture.whenStable();
      const configEditor = EditorView.findFromDOM(
        page.querySelector<HTMLElement>('[id$="editor-app.config.ts"] .cm-editor')!,
      )!;
      expect(configEditor.state.doc.toString()).toBe(seed.sources.files!['app.config.ts']);

      tabs().find(tab => tab.textContent?.trim() === 'posts.service.ts')!.click();
      await fixture.whenStable();
      const serviceEditor = EditorView.findFromDOM(
        page.querySelector<HTMLElement>('[id$="editor-posts.service.ts"] .cm-editor')!,
      )!;
      expect(serviceEditor.state.doc.toString()).toBe(seed.sources.files!['posts.service.ts']);

      const source = page.querySelector('#code')!;
      const diagram = page.querySelector('app-lesson-diagram')!;
      expect(diagram).not.toBeNull();
      expect(source.compareDocumentPosition(diagram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      const editable = new Set(expectedNames);
      for (const group of seed.diagram!.groups) {
        for (const step of group.steps) {
          for (const node of step.nodes) {
            expect(editable.has(node.file)).toBe(true);
            expect(
              page.querySelector(`[aria-label="Apri ${node.label}, file ${node.file}"]`),
            ).not.toBeNull();
          }
        }
      }

      const serviceNode = [...diagram.querySelectorAll<HTMLButtonElement>('.diagram__node')]
        .find(node => node.textContent?.includes('posts.service.ts'))!;
      serviceNode.click();
      await fixture.whenStable();
      expect(
        tabs().find(tab => tab.textContent?.trim() === 'posts.service.ts')!.getAttribute('aria-selected'),
      ).toBe('true');
    }

    fixture.destroy();
  });
});
