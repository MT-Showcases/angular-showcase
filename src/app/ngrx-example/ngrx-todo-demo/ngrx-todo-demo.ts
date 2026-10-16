// COMPONENT TYPE: Container
// SECTION: State Management - NgRx Todo Demo
//
// ROLE:
// - Demonstrate advanced NgRx patterns with combineLatest
// - Show derived selectors (filtered todos, counts)
// - Mix Signals for local UI state with Observable store state
// - Illustrate view model pattern for synchronized streams
//
// PATTERNS USED:
// - Smart Component pattern with NgRx Store
// - View Model pattern using combineLatest
// - Signal for local UI-only state (input text)
// - Observable for global business state (todos, filter)
// - Derived selectors for computed values
//
// NOTES FOR CONTRIBUTORS:
// - combineLatest prevents race conditions with multiple async pipes
// - Use Signals for UI-only state, Store for business logic state
// - All todos state lives in store/todo/
// - Template uses single subscription: @if (vm$ | async; as vm)

import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { AppState } from '../../store/app.state';
import { TodoState, Todo } from '../../store/todo/todo.state';
import * as TodoActions from '../../store/todo/todo.actions';
import * as TodoSelectors from '../../store/todo/todo.selectors';
import * as ActionsLogActions from '../../store/actions-log/actions-log.actions';
import * as ActionsLogSelectors from '../../store/actions-log/actions-log.selectors';

@Component({
  selector: 'app-ngrx-todo-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ngrx-todo-demo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./ngrx-todo-demo.scss'],
})
export class NgrxTodoDemo {
  // PATTERN: View Model with combineLatest
  // PURPOSE:
  // - Combine all observables into single stream to avoid:
  //   • Race conditions with nested async pipes
  //   • Component unmounting when observable emits empty array
  // - Template uses: @if (vm$ | async; as vm) { ... }
  // - Single subscription point, all selectors synchronized
  vm$;

  // PATTERN: Local UI state with Signal
  // PURPOSE:
  // - Signal for local input state (no need for Store)
  // - This is UI-only state, not business logic state
  // - Avoids Store pollution with ephemeral UI values
  newTodoText = signal('');

  constructor(private store: Store<AppState>) {
    // combineLatest emits object when ALL observables have emitted at least once
    // Each new emission from any selector triggers a new combined emit
    this.vm$ = combineLatest({
      todoState: this.store.select(TodoSelectors.selectTodoStateFull),
      actionsLog: this.store.select(ActionsLogSelectors.selectLogs),
      // Derived selectors: compute values from other selectors
      filteredTodos: this.store.select(TodoSelectors.selectFilteredTodos),
      activeTodosCount: this.store.select(TodoSelectors.selectActiveTodosCount),
      completedTodosCount: this.store.select(TodoSelectors.selectCompletedTodosCount),
    });
  }

  // 🚀 ACTIONS: Methods that dispatch actions to the Store

  /**
   * Add a new todo to the Store
   * Flow: validate → dispatch → reducer adds → selector emits → UI updates
   */
  addTodo() {
    const text = this.newTodoText().trim();
    if (text) {
      // Dispatch action with payload
      this.store.dispatch(TodoActions.addTodo({ text }));
      // Reset local state
      this.newTodoText.set('');
    }
  }

  /**
   * Toggle the completed state of a todo
   * The reducer finds the todo by id and inverts the completed flag
   */
  toggleTodo(id: number) {
    this.store.dispatch(TodoActions.toggleTodo({ id }));
  }

  /**
   * Remove a todo from the Store
   * The reducer filters the array removing the todo with this id
   */
  deleteTodo(id: number) {
    this.store.dispatch(TodoActions.deleteTodo({ id }));
  }

  /**
   * Change the current filter (all | active | completed)
   * The filteredTodos selector will react by emitting the filtered array
   */
  setFilter(filter: 'all' | 'active' | 'completed') {
    this.store.dispatch(TodoActions.setFilter({ filter }));
  }

  /**
   * Remove all completed todos at once
   * The reducer filters the array keeping only todos with completed = false
   */
  clearCompleted() {
    this.store.dispatch(TodoActions.clearCompleted());
  }

  /**
   * Pulisce il log delle actions (cross-slice action)
   */
  clearLogs() {
    this.store.dispatch(ActionsLogActions.clearLogs());
  }
}
