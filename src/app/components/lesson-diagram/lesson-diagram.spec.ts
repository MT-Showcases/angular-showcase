import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonDiagram, LessonDiagramData } from './lesson-diagram';

const DATA: LessonDiagramData = {
  title: 'Un provider, un solo oggetto',
  description: 'Le viste ricevono lo **stesso oggetto** dal padre con `inject()`.',
  groups: [
    {
      title: 'Provider del padre',
      steps: [
        {
          nodes: [{ id: 'parent', label: 'Componente padre', file: 'component.ts', detail: 'providers: [CounterService]' }],
          connection: { direction: 'down', label: 'fornisce' },
        },
        {
          nodes: [{ id: 'instance', label: 'Istanza condivisa', file: 'counter.service.ts' }],
        },
      ],
    },
  ],
  note: 'Schema della configurazione iniziale.',
};

describe('Lesson diagram', () => {
  async function create(activeFile = ''): Promise<{ page: HTMLElement; fixture: ComponentFixture<LessonDiagram> }> {
    TestBed.configureTestingModule({ imports: [LessonDiagram] });
    const fixture = TestBed.createComponent(LessonDiagram);
    fixture.componentRef.setInput('data', DATA);
    fixture.componentRef.setInput('activeFile', activeFile);
    await fixture.whenStable();
    return { page: fixture.nativeElement as HTMLElement, fixture };
  }

  it('renders named groups, connection labels and accessible file buttons', async () => {
    const { page, fixture } = await create();
    expect(page.textContent).toContain('Provider del padre');
    expect(page.textContent).toContain('fornisce');
    expect(page.querySelector('.diagram__description strong')?.textContent).toBe('stesso oggetto');
    expect(page.querySelector('.diagram__description code')?.textContent).toBe('inject()');
    expect(page.textContent).toContain('Schema della configurazione iniziale.');

    const buttons = [...page.querySelectorAll<HTMLButtonElement>('.diagram__node')];
    expect(buttons).toHaveLength(2);
    expect(buttons.map(button => button.getAttribute('aria-label'))).toEqual([
      'Apri Componente padre, file component.ts',
      'Apri Istanza condivisa, file counter.service.ts',
    ]);
    expect(buttons.every(button => button.type === 'button')).toBe(true);

    const icons = [...page.querySelectorAll('mat-icon')];
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.every(icon => icon.getAttribute('aria-hidden') === 'true')).toBe(true);

    fixture.destroy();
  });

  it('marks every node of the open file beyond color and emits the chosen file', async () => {
    const { page, fixture } = await create('counter.service.ts');
    const button = page.querySelector<HTMLButtonElement>('.diagram__node[aria-current="true"]')!;
    expect(button).not.toBeNull();
    expect(button.textContent).toContain('Aperto');
    expect(button.textContent).toContain('counter.service.ts');

    const selected: string[] = [];
    fixture.componentInstance.fileSelect.subscribe(file => selected.push(file));
    button.focus();
    button.click();
    expect(selected).toEqual(['counter.service.ts']);
    expect(document.activeElement).toBe(button);

    fixture.destroy();
  });
});
