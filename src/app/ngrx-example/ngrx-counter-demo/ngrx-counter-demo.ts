// COMPONENT TYPE: Container
// SECTION: State Management - NgRx Counter Demo
//
// ROLE:
// - Demonstrate basic NgRx Store integration
// - Show selector usage with Observable streams
// - Illustrate action dispatching pattern
// - Display actions log for educational visibility
//
// PATTERNS USED:
// - Smart Component pattern (NgRx Store integration)
// - Observable selectors with async pipe in template
// - Action dispatching for state updates
// - Memoized selectors for performance
//
// NOTES FOR CONTRIBUTORS:
// - This is an educational demo, keep logic simple
// - All state lives in store/counter/
// - Actions log demonstrates Redux DevTools alternative
// - Follow this pattern for new store features

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { AppState } from '../../store/app.state';
import { CounterState } from '../../store/counter/counter.state';
import * as CounterActions from '../../store/counter/counter.actions';
import * as CounterSelectors from '../../store/counter/counter.selectors';
import * as ActionsLogActions from '../../store/actions-log/actions-log.actions';
import * as ActionsLogSelectors from '../../store/actions-log/actions-log.selectors';

@Component({
  selector: 'app-ngrx-counter-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ngrx-counter-demo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./ngrx-counter-demo.scss'],
})
export class NgrxCounterDemo {
  // SELECTORS: Observable streams from Store
  // These Observables emit automatically when state changes
  counterState$: Observable<CounterState>;
  actionsLog$: Observable<string[]>;

  constructor(private store: Store<AppState>) {
    // Select data from Store using selectors
    // Selectors are pure, memoized functions for optimal performance
    this.counterState$ = this.store.select(CounterSelectors.selectCounterFull);
    this.actionsLog$ = this.store.select(ActionsLogSelectors.selectLogs);
  }

  // ACTIONS: Methods that dispatch actions to Store
  // Each dispatch triggers the corresponding reducer to update state

  // Increment counter by 1
  // Flow: dispatch → reducer → new state → selector emits → template updates
  increment() {
    this.store.dispatch(CounterActions.increment());
  }

  /**
   * Decrementa il counter di 1
   */
  decrement() {
    this.store.dispatch(CounterActions.decrement());
  }

  /**
   * Resetta il counter a 0 e pulisce lo storico
   */
  reset() {
    this.store.dispatch(CounterActions.reset());
  }

  /**
   * Pulisce il log delle actions (cross-slice action)
   */
  clearLogs() {
    this.store.dispatch(ActionsLogActions.clearLogs());
  }
}
