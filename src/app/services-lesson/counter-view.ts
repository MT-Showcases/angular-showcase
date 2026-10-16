// COMPONENT TYPE: Lesson demo
// ROLE: Use an inherited service; report user actions to the lesson's single live region.
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LessonCounterService } from './lesson-counter.service';

@Component({
  selector: 'app-lesson-counter',
  imports: [MatButtonModule],
  templateUrl: './counter-view.html',
  styleUrl: './counter-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterView {
  readonly label = input.required<string>();
  readonly action = output<string>();
  readonly counter = inject(LessonCounterService);

  increment(): void {
    this.counter.increment();
    this.action.emit(`${this.label()}: conteggio ${this.counter.count()}.`);
  }

  reset(): void {
    this.counter.reset();
    this.action.emit(`${this.label()}: contatore del suo servizio ripristinato a zero.`);
  }
}

/** The local provider shadows the lesson's provider for this subtree. */
@Component({
  selector: 'app-isolated-lesson-counter',
  imports: [CounterView],
  providers: [LessonCounterService],
  template: `<app-lesson-counter [label]="label()" (action)="action.emit($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsolatedCounterView {
  readonly label = input.required<string>();
  readonly action = output<string>();
  readonly counter = inject(LessonCounterService);
}
