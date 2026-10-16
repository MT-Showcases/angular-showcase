import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { provideRouter } from '@angular/router';
import { ComponentCommunication } from './component-communication';
import { VoteCard, VotingOption } from './vote-card';

@Component({
  imports: [VoteCard],
  template: `<app-vote-card [option]="option" (voteRequested)="requests.push($event)" />`,
})
class RecordingParent {
  readonly option: VotingOption = Object.freeze({ id: 'practice', title: 'Pratica', votes: 0 });
  readonly requests: string[] = [];
}

describe('Reusable VoteCard output contract', () => {
  it('emits an identifier without changing input data when the host chooses only to record the request', async () => {
    await TestBed.configureTestingModule({ imports: [RecordingParent] }).compileComponents();
    const fixture = TestBed.createComponent(RecordingParent);
    await fixture.whenStable();
    const button = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatButtonHarness);
    await button.click();

    expect(fixture.componentInstance.requests).toEqual(['practice']);
    expect(fixture.componentInstance.option.votes).toBe(0);
    expect(fixture.nativeElement.querySelector('#vote-count-practice').textContent)
      .toBe('Voti ricevuti dal padre: 0');
  });
});

describe('Component communication lesson', () => {
  let fixture: ComponentFixture<ComponentCommunication>;
  let loader: HarnessLoader;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentCommunication],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ComponentCommunication);
    loader = TestbedHarnessEnvironment.loader(fixture);
    page = fixture.nativeElement;
    await fixture.whenStable();
  });

  async function voteButtons(): Promise<MatButtonHarness[]> {
    return loader.getAllHarnesses(MatButtonHarness.with({ selector: 'app-vote-card button' }));
  }

  async function click(id: string): Promise<void> {
    await (await loader.getHarness(MatButtonHarness.with({ selector: `#${id}` }))).click();
  }

  it('passes a parent edit to the matching child without emitting a vote or replacing either child', async () => {
    const children = Array.from(page.querySelectorAll('app-vote-card'));
    await (await loader.getHarness(MatInputHarness)).setValue('Componenti');

    expect(page.querySelector('#vote-title-templates')?.textContent).toBe('Componenti');
    expect(page.querySelector('#vote-title-events')?.textContent).toBe('Eventi');
    expect(page.querySelector('#communication-parent-state')?.textContent).toContain('templates — Componenti: 0 voti');
    expect(page.querySelector('#communication-last-request')?.textContent).toContain('Richieste accolte dal padre: 0');
    expect(Array.from(page.querySelectorAll('app-vote-card'))).toEqual(children);
    expect(page.querySelector('[aria-label="Vota Componenti"]')).not.toBeNull();
  });

  it('routes typed child requests to the parent and keeps sibling data independent', async () => {
    const initialOption = fixture.componentInstance.options[0];
    const buttons = await voteButtons();
    await buttons[0].click();

    expect(page.querySelector('#vote-count-templates')?.textContent).toContain('1');
    expect(page.querySelector('#vote-count-events')?.textContent).toContain('0');
    expect(page.querySelector('#communication-last-request')?.textContent).toContain('voteRequested: templates');
    expect(initialOption.votes).toBe(0);
    expect(fixture.componentInstance.options[0]).not.toBe(initialOption);

    await buttons[1].click();
    expect(page.querySelector('#vote-count-templates')?.textContent).toContain('1');
    expect(page.querySelector('#vote-count-events')?.textContent).toContain('1');
    expect(page.querySelector('#communication-last-request')?.textContent).toContain('voteRequested: events');
    expect(page.querySelector('#communication-last-request')?.textContent).toContain('Richieste accolte dal padre: 2');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('il padre ha aggiornato i voti');
  });

  it('disables only the option at its voting limit and explains why', async () => {
    const buttons = await voteButtons();
    await buttons[0].click();
    await buttons[0].click();
    await buttons[0].click();

    expect(await buttons[0].isDisabled()).toBe(true);
    expect(await buttons[1].isDisabled()).toBe(false);
    expect(page.querySelector('#vote-reason-templates')?.textContent).toContain('Limite di 3 voti raggiunto');
    expect(page.querySelector('#vote-count-templates')?.textContent).toContain('3');
    await buttons[1].click();
    expect(page.querySelector('#vote-count-events')?.textContent).toContain('1');
    expect(page.querySelector('#communication-last-request')?.textContent).toContain('Richieste accolte dal padre: 4');
  });

  it('propagates pause and resume to both children without losing previous votes', async () => {
    const buttons = await voteButtons();
    await buttons[0].click();
    await click('communication-pause');
    expect(await Promise.all(buttons.map(button => button.isDisabled()))).toEqual([true, true]);
    expect(page.querySelector('#communication-pause')?.getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelector('#vote-reason-events')?.textContent).toContain('Votazione in pausa');

    await click('communication-pause');
    expect(await Promise.all(buttons.map(button => button.isDisabled()))).toEqual([false, false]);
    await buttons[1].click();
    expect(page.querySelector('#vote-count-templates')?.textContent).toContain('1');
    expect(page.querySelector('#vote-count-events')?.textContent).toContain('1');
  });

  it('resets parent state and updates the existing child instances', async () => {
    const children = Array.from(page.querySelectorAll('app-vote-card'));
    const buttons = await voteButtons();
    await (await loader.getHarness(MatInputHarness)).setValue('Titolo diverso');
    await buttons[0].click();
    await click('communication-pause');
    await click('communication-reset');

    expect(await (await loader.getHarness(MatInputHarness)).getValue()).toBe('Template');
    expect(page.querySelector('#vote-title-templates')?.textContent).toBe('Template');
    expect(page.querySelector('#vote-count-templates')?.textContent).toContain('0');
    expect(page.querySelector('#vote-count-events')?.textContent).toContain('0');
    expect(page.querySelector('#communication-last-request')?.textContent).toContain('voteRequested: nessuno');
    expect(page.querySelector('#communication-last-request')?.textContent).toContain('Richieste accolte dal padre: 0');
    expect(await Promise.all(buttons.map(button => button.isDisabled()))).toEqual([false, false]);
    expect(page.querySelector('#communication-pause')?.getAttribute('aria-pressed')).toBe('false');
    expect(Array.from(page.querySelectorAll('app-vote-card'))).toEqual(children);
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Demo ripristinata');
  });

  it('preserves the edited input, votes and child instances across disclosure changes', async () => {
    await (await loader.getHarness(MatInputHarness)).setValue('Stato locale');
    await (await voteButtons())[0].click();
    const children = Array.from(page.querySelectorAll('app-vote-card'));
    for (const panel of await loader.getAllHarnesses(MatExpansionPanelHarness)) {
      await panel.expand();
      await panel.collapse();
    }

    expect(page.querySelector('#vote-title-templates')?.textContent).toBe('Stato locale');
    expect(page.querySelector('#vote-count-templates')?.textContent).toContain('1');
    expect(page.querySelector('#communication-last-request')?.textContent).toContain('Richieste accolte dal padre: 1');
    expect(Array.from(page.querySelectorAll('app-vote-card'))).toEqual(children);
  });
});
