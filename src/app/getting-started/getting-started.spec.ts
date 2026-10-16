import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { provideRouter } from '@angular/router';
import { GettingStarted } from './getting-started';

describe('First component lesson', () => {
  let fixture: ComponentFixture<GettingStarted>;
  let loader: HarnessLoader;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GettingStarted],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(GettingStarted);
    loader = TestbedHarnessEnvironment.loader(fixture);
    page = fixture.nativeElement;
    await fixture.whenStable();
  });

  async function click(id: string): Promise<void> {
    await (await loader.getHarness(MatButtonHarness.with({ selector: `#${id}` }))).click();
  }

  it('changes text, numeric state and the preview style independently through its controls', async () => {
    const field = await loader.getHarness(MatInputHarness);
    await field.setValue('Benvenuta, Ada!');
    expect(page.querySelector('#starter-preview-title')?.textContent).toBe('Benvenuta, Ada!');
    expect(page.querySelector('#starter-count')?.textContent).toContain('0');

    await click('starter-increment');
    await click('starter-increment');
    expect(page.querySelector('#starter-count')?.textContent).toBe('Conteggio locale: 2');
    expect(page.querySelector('#starter-preview-title')?.textContent).toBe('Benvenuta, Ada!');

    await click('starter-highlight');
    expect(page.querySelector('.starter-preview--highlighted')).not.toBeNull();
    expect(page.querySelector('#starter-highlight')?.getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelector('[role="status"]')?.textContent).toBe('Scheda evidenziata.');
    await click('starter-highlight');
    expect(page.querySelector('.starter-preview--highlighted')).toBeNull();
    expect(page.querySelector('#starter-count')?.textContent).toContain('2');
  });

  it('restores every local value and announces the reset', async () => {
    const field = await loader.getHarness(MatInputHarness);
    await field.setValue('Un altro messaggio');
    await click('starter-increment');
    await click('starter-highlight');
    await click('starter-reset');

    expect(await field.getValue()).toBe('Ciao, Angular!');
    expect(page.querySelector('#starter-preview-title')?.textContent).toBe('Ciao, Angular!');
    expect(page.querySelector('#starter-count')?.textContent).toBe('Conteggio locale: 0');
    expect(page.querySelector('.starter-preview--highlighted')).toBeNull();
    expect(page.querySelector('#starter-highlight')?.getAttribute('aria-pressed')).toBe('false');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Demo ripristinata');
  });

  it('keeps an empty input meaningful and renders entered markup as text', async () => {
    const field = await loader.getHarness(MatInputHarness);
    await field.setValue('');
    expect(page.querySelector('#starter-preview-title')?.textContent).toBe('Scrivi un messaggio');
    await field.setValue('<strong>Ada</strong>');
    expect(page.querySelector('#starter-preview-title')?.textContent).toBe('<strong>Ada</strong>');
    expect(page.querySelector('#starter-preview-title strong')).toBeNull();
  });

  it('preserves the experiment while the learner inspects code and lifecycle explanations', async () => {
    await (await loader.getHarness(MatInputHarness)).setValue('Esperimento aperto');
    await click('starter-increment');
    await click('starter-highlight');
    const preview = page.querySelector('.starter-preview');
    for (const panel of await loader.getAllHarnesses(MatExpansionPanelHarness)) {
      await panel.expand();
      await panel.collapse();
    }

    expect(page.querySelector('.starter-preview')).toBe(preview);
    expect(page.querySelector('#starter-preview-title')?.textContent).toBe('Esperimento aperto');
    expect(page.querySelector('#starter-count')?.textContent).toBe('Conteggio locale: 1');
    expect(page.querySelector('.starter-preview--highlighted')).not.toBeNull();
  });
});
