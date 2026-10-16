// COMPONENT TYPE: Container
// SECTION: State Management - NgRx
//
// ROLE:
// - Demonstrate NgRx state management patterns
// - Organize multiple NgRx examples with tab navigation
// - Show concepts, counter demo, and todo demo
//
// PATTERNS USED:
// - Standalone component architecture
// - Signal-based tab selection
// - Composition of multiple demo components
//
// NOTES FOR CONTRIBUTORS:
// - Keep this component as a coordinator only
// - Complex NgRx logic lives in child components
// - Add new demos as separate components and import here
// - Maintain consistent tab structure for navigation

import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { PageHeader } from '../page-header/page-header';
import { NgrxConcepts } from './ngrx-concepts/ngrx-concepts';
import { NgrxCounterDemo } from './ngrx-counter-demo/ngrx-counter-demo';
import { NgrxTodoDemo } from './ngrx-todo-demo/ngrx-todo-demo';

@Component({
  selector: 'app-ngrx-example',
  standalone: true,
  imports: [PageHeader, NgrxConcepts, NgrxCounterDemo, NgrxTodoDemo],
  templateUrl: './ngrx-example.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./ngrx-example.scss'],
})
export class NgrxExample {
  selectedTab = signal<'counter' | 'todos' | 'concepts'>('concepts');
}
