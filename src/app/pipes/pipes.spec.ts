// COMPONENT TYPE: Test Suite
// SECTION: Angular Basics
// ROLE: Verify parameter-driven formatting and immutable custom-pipe updates through the UI.
// PATTERNS USED: Public Material harnesses and visible source/output assertions.
// NOTES FOR CONTRIBUTORS: Keep expected dates independent of the machine timezone.
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideRouter } from '@angular/router';
import { PipesLesson } from './pipes';
import { TagListPipe } from './tag-list-pipe';

describe('PipesLesson', () => {
  let fixture: ComponentFixture<PipesLesson>;
  let loader: HarnessLoader;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PipesLesson], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(PipesLesson);
    loader = TestbedHarnessEnvironment.loader(fixture);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  function result(id: string): string {
    return element.querySelector(`[data-testid="${id}"]`)?.textContent?.trim() ?? '';
  }

  async function select(index: number, text: string): Promise<void> {
    const control = (await loader.getAllHarnesses(MatSelectHarness))[index];
    await control.open();
    await control.clickOptions({ text });
  }

  it('formats the same ISO value with an explicit format and timezone', async () => {
    expect(result('date-result')).toBe('2026-10-16');
    await select(0, 'Giorno/mese/anno');
    expect(result('date-result')).toBe('16/10/2026');
    await select(0, 'Ora e minuti');
    expect(result('date-result')).toBe('10:30');
    await select(1, 'Scarto fisso UTC+02:00');
    expect(result('date-result')).toBe('12:30');
    expect(result('date-raw')).toBe('2026-10-16T10:30:00Z');
  });

  it('changes currency presentation without converting or mutating the amount', async () => {
    expect(result('currency-result')).toBe('€1,234.50');
    await select(2, 'Dollaro statunitense');
    expect(result('currency-result')).toBe('$1,234.50');
    await select(3, 'Codice');
    expect(result('currency-result')).toContain('USD');
    expect(result('amount-raw')).toBe('1234.5');
    const amount = await loader.getHarness(MatInputHarness.with({ selector: '[type="number"]' }));
    await amount.setValue('42.2');
    expect(result('currency-result')).toContain('42.20');
    expect(result('amount-raw')).toBe('42.2');
    await amount.setValue('');
    expect(result('currency-result')).toContain('Inserisci un numero');
  });

  it('transforms edited text while retaining its original casing', async () => {
    const input = (await loader.getAllHarnesses(MatInputHarness))[1];
    await input.setValue('Ciao Angular');
    expect(result('uppercase-result')).toBe('CIAO ANGULAR');
    expect(result('text-raw')).toBe('Ciao Angular');
  });

  it('creates a new array for the pure pipe, changes its parameter and restores all defaults', async () => {
    const original = fixture.componentInstance.labels();
    const input = (await loader.getAllHarnesses(MatInputHarness))[2];
    const add = await loader.getHarness(MatButtonHarness.with({ text: 'Aggiungi etichetta' }));
    await input.setValue('   ');
    expect(await add.isDisabled()).toBe(true);
    await input.setValue('  componenti  ');
    await add.click();
    expect(fixture.componentInstance.labels()).not.toBe(original);
    expect(original).toEqual(['template', 'dati']);
    expect(result('labels-result')).toBe('template · dati · componenti');
    await select(4, 'Barra');
    expect(result('labels-result')).toBe('template / dati / componenti');
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Ripristina tutti i valori' }))).click();
    expect(result('labels-result')).toBe('template · dati');
    expect(result('currency-result')).toBe('€1,234.50');
    expect(result('date-result')).toBe('2026-10-16');
    expect(await input.getValue()).toBe('');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('ripristinati');
  });
});

describe('TagListPipe', () => {
  it('formats frozen input without mutation and supports an empty list and separator', () => {
    const pipe = new TagListPipe();
    const source = Object.freeze(['uno', 'due']);
    expect(pipe.transform(source)).toBe('uno · due');
    expect(pipe.transform(source, ' / ')).toBe('uno / due');
    expect(pipe.transform(source, '')).toBe('unodue');
    expect(pipe.transform([])).toBe('');
    expect(source).toEqual(['uno', 'due']);
  });
});
