// SERVICE TYPE: Lesson-scoped state and behavior
// ROLE: Keep the counter rules in one place; providers determine which views share the state.
import { Injectable, signal } from '@angular/core';

/** No root registration: each lesson or isolated component supplies its own instance. */
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
}
