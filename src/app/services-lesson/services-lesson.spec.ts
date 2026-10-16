import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { provideRouter } from '@angular/router';
import { ServicesLesson } from './services-lesson';

describe('Services and dependency injection lesson', () => {
  let fixture: ComponentFixture<ServicesLesson>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesLesson], providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ServicesLesson);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  function count(label: string, target = fixture): string {
    return target.nativeElement.querySelector(`[aria-label="${label}"] .service-counter__value`).textContent.trim();
  }

  function counts(target = fixture): string[] {
    return ['Condivisa A', 'Condivisa B', 'Isolata A', 'Isolata B'].map(label => count(label, target));
  }

  async function click(label: string) {
    await (await loader.getHarness(MatButtonHarness.with({ selector: `[aria-label="${label}"]` }))).click();
  }

  async function deepenPanel() {
    return loader.getHarness(MatExpansionPanelHarness.with({ title: /Approfondisci gerarchia/ }));
  }

  it('starts with visible demos and leaves source and advanced explanations optional', async () => {
    expect(counts()).toEqual(['0', '0', '0', '0']);
    expect(fixture.nativeElement.querySelectorAll('#demo app-lesson-counter')).toHaveLength(4);
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    expect(await Promise.all(panels.map(panel => panel.isExpanded()))).toEqual([false, false]);
  });

  it('shares one instance between inherited consumers and resets both from either view', async () => {
    await click('Aumenta Condivisa A');
    expect(counts()).toEqual(['1', '1', '0', '0']);
    await click('Aumenta Condivisa B');
    expect(counts()).toEqual(['2', '2', '0', '0']);
    await click('Aumenta Isolata A');
    await click('Azzera Condivisa B');
    expect(counts()).toEqual(['0', '0', '1', '0']);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Condivisa B');
  });

  it('isolates component providers and lets the learner reset one or all services', async () => {
    await click('Aumenta Isolata A');
    await click('Aumenta Isolata A');
    await click('Aumenta Isolata B');
    expect(counts()).toEqual(['0', '0', '2', '1']);
    await click('Azzera Isolata B');
    expect(counts()).toEqual(['0', '0', '2', '0']);
    await click('Aumenta Condivisa B');
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Azzera tutti i contatori' }))).click();
    expect(counts()).toEqual(['0', '0', '0', '0']);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Tutti i servizi');
  });

  it('preserves state when reading explanations and creates new isolated state after removal', async () => {
    await click('Aumenta Condivisa A');
    await click('Aumenta Isolata A');
    const panel = await deepenPanel();
    await panel.expand();
    await panel.collapse();
    expect(counts()).toEqual(['1', '1', '1', '0']);
    await panel.expand();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Rimuovi i contatori isolati' }))).click();
    expect(fixture.nativeElement.querySelectorAll('app-isolated-lesson-counter')).toHaveLength(0);
    expect(count('Condivisa A')).toBe('1');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('rimossi');
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Ricrea i contatori isolati' }))).click();
    expect(counts()).toEqual(['1', '1', '0', '0']);
    await click('Aumenta Isolata B');
    expect(counts()).toEqual(['1', '1', '0', '1']);
  });

  it('does not turn the lesson-scoped shared service into an application-wide singleton', async () => {
    const second = TestBed.createComponent(ServicesLesson);
    await second.whenStable();
    try {
      await click('Aumenta Condivisa A');
      expect(counts()).toEqual(['1', '1', '0', '0']);
      expect(counts(second)).toEqual(['0', '0', '0', '0']);
    } finally {
      second.destroy();
    }
  });

  it('resets local state when the lesson itself is destroyed and recreated', async () => {
    await click('Aumenta Condivisa A');
    await click('Aumenta Isolata B');
    fixture.destroy();
    fixture = TestBed.createComponent(ServicesLesson);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
    expect(counts()).toEqual(['0', '0', '0', '0']);
  });
});
