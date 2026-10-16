// COMPONENT TYPE: Learning container
// SECTION: Angular Basics — Services and dependency injection
// ROLE: Demonstrate extraction, inherited providers and independent component-scoped instances.
import { ChangeDetectionStrategy, Component, inject, signal, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { CounterView, IsolatedCounterView } from './counter-view';
import { LessonCounterService } from './lesson-counter.service';

@Component({
  selector: 'app-services-lesson',
  imports: [RouterLink, MatButtonModule, LessonShell, LessonDisclosure, CodeBlock, CounterView, IsolatedCounterView],
  providers: [LessonCounterService],
  templateUrl: './services-lesson.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesLesson {
  readonly counter = inject(LessonCounterService);
  readonly isolatedVisible = signal(true);
  readonly feedback = signal('Tutti i contatori partono da zero. Prova una vista condivisa.');
  private readonly isolatedViews = viewChildren(IsolatedCounterView);

  readonly serviceExample = `// Complete file: lesson-counter.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable()
export class LessonCounterService {
  private readonly currentCount = signal(0);
  readonly count = this.currentCount.asReadonly();

  increment(): void {
    this.currentCount.update(value => value + 1);
  }

  reset(): void {
    this.currentCount.set(0);
  }
}`;
  readonly consumerExample = `// Class fragment from CounterView.
// Import inject from '@angular/core' and LessonCounterService from './lesson-counter.service'.
readonly counter = inject(LessonCounterService);`;
  readonly templateExample = `<!-- Minimal template fragment. Import MatButtonModule in the standalone component.
     The full demo adds accessible labels and action announcements. -->
<p>Conteggio: {{ counter.count() }}</p>
<button matButton="filled" type="button" (click)="counter.increment()">Aumenta</button>
<button matButton="outlined" type="button" (click)="counter.reset()">Azzera</button>`;
  readonly providerExample = `// Decorator fragments; import Component from '@angular/core',
// CounterView from './counter-view', and LessonCounterService from './lesson-counter.service'.

// ServicesLesson registers ONE instance for itself and the descendants that inherit it.
@Component({
  imports: [CounterView],
  providers: [LessonCounterService],
  template: \`<app-lesson-counter label="Condivisa A" />
             <app-lesson-counter label="Condivisa B" />\`,
})
export class ServicesLesson { /* Other lesson sections omitted. */ }

// Each IsolatedCounterView instance registers its OWN provider.
@Component({
  imports: [CounterView],
  providers: [LessonCounterService],
  template: \`<app-lesson-counter [label]="label()" />\`,
})
export class IsolatedCounterView { /* label is an input; see the component lesson. */ }`;
  readonly rootExample = `// Alternative registration; this is NOT the provider configuration of the demo.
// Import Injectable from '@angular/core'. Keep the service's count and methods as above.
@Injectable({ providedIn: 'root' })
export class LessonCounterService { /* Counter implementation omitted. */ }

// Consumers that do not have a closer provider can share the application's root instance.
// A component-level providers: [LessonCounterService] would still create a local instance.`;

  toggleIsolated(): void {
    this.isolatedVisible.update(visible => !visible);
    this.feedback.set(this.isolatedVisible()
      ? 'Contatori isolati ricreati con nuove istanze a zero. Il condiviso conserva il suo valore.'
      : 'Contatori isolati rimossi con i loro servizi. Il condiviso conserva il suo valore.');
  }

  resetAll(): void {
    this.counter.reset();
    for (const view of this.isolatedViews()) view.counter.reset();
    this.feedback.set('Tutti i servizi attualmente visibili sono stati azzerati.');
  }
}
