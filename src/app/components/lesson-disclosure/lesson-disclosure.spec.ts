import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { LessonDisclosure } from './lesson-disclosure';

@Component({
  imports: [LessonDisclosure],
  template: `<button type="button" (click)="count.update(add)">Prova</button><p>{{ count() }}</p>
    <app-lesson-disclosure anchor="code" title="Codice"><p>Spiegazione</p></app-lesson-disclosure>`,
})
class LessonTestPage {
  count = signal(0);
  add = (value: number) => value + 1;
}
describe('Lesson disclosure navigation', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'lesson', component: LessonTestPage }])] }));
  it('opens a direct fragment and retains demo state across disclosure changes', async () => {
    const harness = await RouterTestingHarness.create('/lesson#code');
    const loader = TestbedHarnessEnvironment.loader(harness.fixture);
    const panel = await loader.getHarness(MatExpansionPanelHarness);
    expect(await panel.isExpanded()).toBe(true);
    harness.routeNativeElement!.querySelector('button')!.click();
    await panel.collapse();
    await panel.expand();
    expect(harness.routeNativeElement!.querySelector('p')!.textContent).toBe('1');
  });
  it('opens an existing page disclosure when its fragment changes', async () => {
    const harness = await RouterTestingHarness.create('/lesson');
    const panel = await TestbedHarnessEnvironment.loader(harness.fixture).getHarness(MatExpansionPanelHarness);
    expect(await panel.isExpanded()).toBe(false);
    await harness.navigateByUrl('/lesson#code');
    expect(await panel.isExpanded()).toBe(true);
  });
});
