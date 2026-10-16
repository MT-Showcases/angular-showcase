// COMPONENT TYPE: Presentational
// SECTION: State Management - NgRx Concepts
//
// ROLE:
// - Explain NgRx core concepts (Store, Actions, Reducers, Selectors)
// - Provide code examples for each NgRx building block
// - Compare centralized vs feature-based store patterns
// - Demonstrate Redux DevTools integration
//
// PATTERNS USED:
// - Pure presentational component (no store interaction)
// - Signal-based pattern selection state
// - Composition with ConceptCard and GuideStep components
// - Code examples with CodeBlock component
//
// NOTES FOR CONTRIBUTORS:
// - This is educational content only, no actual store interaction
// - Code examples should match actual implementation in counter/todo demos
// - Keep explanations beginner-friendly
// - Add new patterns to StorePattern type if needed

import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { CodeBlock } from '@components/code-block/code-block';
import { ConceptCard, ConceptCardData } from '@components/concept-card/concept-card';
import { GuideStep, GuideStepData } from '@components/guide-step/guide-step';

// PATTERN: Store pattern type definition
// PURPOSE:
// - Defines available store organization patterns
// - Used for pattern selection and conditional rendering
type StorePattern = 'centralized' | 'feature' | null;

@Component({
  selector: 'app-ngrx-concepts',
  standalone: true,
  imports: [CodeBlock, ConceptCard, GuideStep],
  templateUrl: './ngrx-concepts.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./ngrx-concepts.scss'],
})
export class NgrxConcepts {
  // ═══ STATE ═══
  selectedPattern = signal<StorePattern>(null);

  // ═══ CODE EXAMPLES ═══
  storeCode = `// store/counter.state.ts
export interface CounterState {
  count: number;
  history: number[];
}

export const initialState: CounterState = {
  count: 0,
  history: [0]
};`;

  actionsCode = `// store/counter.actions.ts
import { createAction, props } from '@ngrx/store';

export const increment = createAction('[Counter] Increment');
export const decrement = createAction('[Counter] Decrement');
export const reset = createAction('[Counter] Reset');
export const setValue = createAction(
  '[Counter] Set Value',
  props<{ value: number }>()
);`;

  reducerCode = `// store/counter.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as CounterActions from './counter.actions';

export const counterReducer = createReducer(
  initialState,
  on(CounterActions.increment, state => ({
    ...state,
    count: state.count + 1,
    history: [...state.history, state.count + 1]
  })),
  on(CounterActions.decrement, state => ({
    ...state,
    count: state.count - 1,
    history: [...state.history, state.count - 1]
  })),
  on(CounterActions.reset, state => ({
    count: 0,
    history: [0]
  }))
);`;

  selectorsCode = `// store/counter.selectors.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CounterState } from './counter.state';

export const selectCounterState =
  createFeatureSelector<CounterState>('counter');

export const selectCount = createSelector(
  selectCounterState,
  state => state.count
);

export const selectHistory = createSelector(
  selectCounterState,
  state => state.history
);

export const selectLastChange = createSelector(
  selectHistory,
  history => history.length > 1
    ? history[history.length - 1] - history[history.length - 2]
    : 0
);`;

  effectsCode = `// store/counter.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap, map } from 'rxjs/operators';
import * as CounterActions from './counter.actions';

@Injectable()
export class CounterEffects {

  // Save value to localStorage
  saveCounter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        CounterActions.increment,
        CounterActions.decrement,
        CounterActions.reset
      ),
      tap(() => {
        // Side effect: save to storage
        console.log('Saving counter...');
      })
    ),
    { dispatch: false }
  );

  // Load value on startup
  loadCounter$ = createEffect(() =>
    this.actions$.pipe(
      ofType('[App] Init'),
      map(() => {
        const saved = localStorage.getItem('counter');
        return CounterActions.setValue({
          value: saved ? JSON.parse(saved) : 0
        });
      })
    )
  );

  constructor(private actions$: Actions) {}
}`;

  componentCode = `// component.ts
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as CounterActions from './store/counter.actions';
import { selectCount } from './store/counter.selectors';

@Component({
  selector: 'app-counter',
  template: \`
    <div>
      <h2>Count: {{ count$ | async }}</h2>
      <button (click)="increment()">+</button>
      <button (click)="decrement()">-</button>
      <button (click)="reset()">Reset</button>
    </div>
  \`
})
export class CounterComponent {
  count$: Observable<number>;

  constructor(private store: Store) {
    this.count$ = this.store.select(selectCount);
  }

  increment() {
    this.store.dispatch(CounterActions.increment());
  }

  decrement() {
    this.store.dispatch(CounterActions.decrement());
  }

  reset() {
    this.store.dispatch(CounterActions.reset());
  }
}`;

  installCode = `# Installazione base
npm install @ngrx/store @ngrx/store-devtools --legacy-peer-deps

# Oppure con ng add (raccomandato)
ng add @ngrx/store --legacy-peer-deps
ng add @ngrx/store-devtools --legacy-peer-deps

# Per Angular 21+, crea .npmrc nella root:
echo "legacy-peer-deps=true" > .npmrc

# Poi installa normalmente:
npm install @ngrx/store @ngrx/store-devtools`;

  setupCode = `// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { counterReducer } from './store/counter.reducer';
import { CounterEffects } from './store/counter.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({ counter: counterReducer }),
    provideEffects([CounterEffects]),
    provideStoreDevtools({ maxAge: 25 })
  ]
};`;

  // ═══ CENTRALIZED STORE EXAMPLES ═══
  centralizedStateCode = `// store/app.state.ts
import { CounterState } from './counter/counter.state';
import { TodoState } from './todo/todo.state';
import { ActionsLogState } from './actions-log/actions-log.state';

// Global state interface combining all features
export interface AppState {
  counter: CounterState;
  todo: TodoState;
  actionsLog: ActionsLogState;
}`;

  combinedReducersCode = `// store/app.reducers.ts
import { ActionReducerMap } from '@ngrx/store';
import { AppState } from './app.state';
import { counterReducer } from './counter/counter.reducer';
import { todoReducer } from './todo/todo.reducer';
import { actionsLogReducer } from './actions-log/actions-log.reducer';

// Combine all feature reducers into one
export const appReducers: ActionReducerMap<AppState> = {
  counter: counterReducer,
  todo: todoReducer,
  actionsLog: actionsLogReducer,
};`;

  provideStoreCode = `// app.config.ts (Centralized Store)
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { appReducers } from './store/app.reducers';

export const appConfig: ApplicationConfig = {
  providers: [
    // Provide the combined reducers
    provideStore(appReducers),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false,
      traceLimit: 75,
    })
  ]
};`;

  centralizedSelectorsCode = `// store/counter/counter.selectors.ts
import { createSelector } from '@ngrx/store';
import { AppState } from '../app.state';

// Select the feature state from the global state
export const selectCounterState = (state: AppState) => state.counter;

// Create memoized selectors
export const selectCount = createSelector(
  selectCounterState,
  state => state.count
);

export const selectHistory = createSelector(
  selectCounterState,
  state => state.history
);

// ─────────────────────────────────────────────
// Usage in component:
// this.count$ = this.store.select(selectCount);
// ─────────────────────────────────────────────`;

  // ═══ FEATURE STORE EXAMPLES ═══
  featureStateCode = `// store/counter.state.ts (Feature Store)
export interface CounterState {
  count: number;
  history: number[];
}

export const initialState: CounterState = {
  count: 0,
  history: [0]
};

// Each feature manages its own state independently`;

  featureReducerCode = `// store/counter.reducer.ts (Feature Store)
import { createReducer, on } from '@ngrx/store';
import * as CounterActions from './counter.actions';
import { initialState } from './counter.state';

export const counterReducer = createReducer(
  initialState,
  on(CounterActions.increment, state => ({
    ...state,
    count: state.count + 1,
    history: [...state.history, state.count + 1]
  })),
  on(CounterActions.decrement, state => ({
    ...state,
    count: state.count - 1,
    history: [...state.history, state.count - 1]
  })),
  on(CounterActions.reset, () => initialState)
);`;

  featureProvideCode = `// app.config.ts (Feature Store)
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

export const appConfig: ApplicationConfig = {
  providers: [
    // Empty root store - features register themselves
    provideStore({}),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
    })
  ]
};`;

  featureModuleCode = `// counter/counter.routes.ts (Feature Store)
import { Route } from '@angular/router';
import { provideState } from '@ngrx/store';
import { counterReducer } from './store/counter.reducer';

export const counterRoutes: Route[] = [
  {
    path: '',
    providers: [
      // Register feature state when route loads
      provideState('counter', counterReducer)
    ],
    loadComponent: () =>
      import('./counter.component').then(m => m.CounterComponent)
  }
];`;

  featureSelectorCode = `// store/counter.selectors.ts (Feature Store)
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CounterState } from './counter.state';

// Select this feature's state slice
export const selectCounterState =
  createFeatureSelector<CounterState>('counter');

export const selectCount = createSelector(
  selectCounterState,
  state => state.count
);

export const selectHistory = createSelector(
  selectCounterState,
  state => state.history
);`;

  // ═══ CONCEPT CARDS DATA ═══
  conceptCards: ConceptCardData[] = [
    {
      icon: '🏪',
      title: 'Store (Centralized)',
      description: 'The central container that holds the entire application state. It is the single source of truth. In this project, we use a centralized store with combined reducers (Redux pattern).',
      code: this.storeCode,
      keyPointsTitle: 'Caratteristiche:',
      keyPoints: ['✓ Immutabile', '✓ Prevedibile', '✓ Centralizzato', '✓ Serializzabile']
    },
    {
      icon: '⚡',
      title: 'Actions',
      description: 'Events that describe something that happened in the application. They are the only way to send data to the store.',
      code: this.actionsCode,
      keyPointsTitle: 'Best Practices:',
      keyPoints: ['✓ Usa nomi descrittivi', '✓ Includi la sorgente [Source]', '✓ Passa dati via props', '✓ Mantienile semplici']
    },
    {
      icon: '⚙️',
      title: 'Reducers',
      description: 'Pure functions that take the current state and an action, and return a new state. They are responsible for managing state transitions.',
      code: this.reducerCode,
      keyPointsTitle: 'Regole:',
      keyPoints: ['✓ Funzioni pure', '✓ No side effects', '✓ No mutazioni dirette', '✓ Ritornano nuovo stato']
    },
    {
      icon: '🔍',
      title: 'Selectors',
      description: 'Pure functions to select and derive data from the store. They are memoized for optimal performance.',
      code: this.selectorsCode,
      keyPointsTitle: 'Vantaggi:',
      keyPoints: ['✓ Memoizzazione', '✓ Riutilizzabili', '✓ Composizione', '✓ Testabili']
    },
    {
      icon: '🌊',
      title: 'Effects',
      description: 'Handle side effects like HTTP calls, routing, storage, etc. They listen to actions and can emit new actions.',
      code: this.effectsCode,
      keyPointsTitle: 'Casi d\'uso:',
      keyPoints: ['✓ Chiamate API', '✓ WebSocket', '✓ LocalStorage', '✓ Routing']
    },
    {
      icon: '🧩',
      title: 'Component Integration',
      description: 'How to integrate NgRx into Angular components using Store injection and selectors.',
      code: this.componentCode,
      keyPointsTitle: 'Pattern:',
      keyPoints: ['✓ Inject Store', '✓ Usa selectors', '✓ Dispatch actions', '✓ Async pipe']
    }
  ];

  // ═══ CENTRALIZED STORE GUIDE STEPS ═══
  centralizedSteps: GuideStepData[] = [
    {
      stepNumber: 1,
      title: '📋 Define State Interfaces',
      explanation: 'The first step is to create TypeScript interfaces that describe the shape of the data. Each <strong>feature</strong> (functionality) of your app will have its own state interface.',
      codeExample: {
        title: 'Esempio: Counter State',
        description: 'Creiamo uno stato per un semplice contatore con storico:',
        code: this.storeCode
      },
      explanationBox: {
        title: '💡 What are we doing?',
        points: [
          '<code>CounterState</code>: defines the counter data structure',
          '<code>count</code>: the current counter value',
          '<code>history</code>: array that tracks all past values',
          '<code>initialState</code>: initial state when the app starts'
        ]
      }
    },
    {
      stepNumber: 2,
      title: '🌍 Create Global State Interface',
      explanation: 'Now we combine all feature states into a single global interface. This is the "main container" that holds the entire application state.',
      codeExample: {
        title: 'File: store/app.state.ts',
        code: this.centralizedStateCode
      },
      explanationBox: {
        title: '💡 Why do we do this?',
        points: [
          'Each feature has its own "slice" in the global state',
          '<code>counter</code>, <code>todo</code>, <code>actionsLog</code> are keys of the global object',
          'TypeScript gives us autocompletion and type-safety',
          'The final state tree will be: <code>&#123; counter: &#123;...&#125;, todo: &#123;...&#125;, actionsLog: &#123;...&#125; &#125;</code>'
        ]
      }
    },
    {
      stepNumber: 3,
      title: '⚡ Define Actions',
      explanation: 'The <strong>Actions</strong> are events that describe "what happened" in the app. They are the only way to send information to the store. Think of them as "commands" or "notifications".',
      codeExample: {
        title: 'File: store/counter/counter.actions.ts',
        code: this.actionsCode
      },
      explanationBox: {
        title: '💡 Anatomy of an Action:',
        points: [
          '<code>[Counter]</code>: prefix that identifies the source (best practice)',
          '<code>Increment</code>: descriptive name of the action',
          '<code>props</code>: optional data to pass (e.g. <code>setValue</code> receives a value)',
          'Actions are <strong>immutable</strong> and <strong>serializable</strong>'
        ]
      }
    },
    {
      stepNumber: 4,
      title: '⚙️ Create Reducers',
      explanation: 'The <strong>Reducers</strong> are pure functions that take the current state and an action, and return a new state. They NEVER modify the existing state, but create an updated copy of it.',
      codeExample: {
        title: 'File: store/counter/counter.reducer.ts',
        code: this.reducerCode
      },
      explanationBox: {
        title: '💡 Golden Rules of Reducers:',
        points: [
          '<strong>Pure functions</strong>: same input = same output, always',
          '<strong>Immutability</strong>: use spread operator <code>{{ \'{\'  }}...state{{ \'}\'  }}</code> to copy',
          '<strong>No side effects</strong>: no API calls, no console.log, no external modifications',
          '<code>on()</code>: associates an action to a function that updates the state'
        ]
      }
    },
    {
      stepNumber: 5,
      title: '🔗 Combine Reducers',
      explanation: 'Now we unite all feature reducers into a single object using <code>ActionReducerMap</code>. This creates the complete map of how each state slice is updated.',
      codeExample: {
        title: 'File: store/app.reducers.ts',
        code: this.combinedReducersCode
      },
      explanationBox: {
        title: '💡 How does it work?',
        points: [
          'Each key (<code>counter</code>, <code>todo</code>, etc.) corresponds to a feature',
          'Each value is the reducer that manages that feature',
          'NgRx will call the right reducer when an action arrives',
          'This is the "bridge" between the global state and individual reducers'
        ]
      }
    },
    {
      stepNumber: 6,
      title: '🚀 Configure Store in App',
      explanation: 'Now we need to "register" the store in the Angular application using <code>provideStore()</code>. This makes the store available throughout the app via dependency injection.',
      codeExample: {
        title: 'File: app.config.ts',
        code: this.provideStoreCode
      },
      explanationBox: {
        title: '💡 What does this code do?',
        points: [
          '<code>provideStore(appReducers)</code>: initializes the store with combined reducers',
          '<code>provideStoreDevtools()</code>: activates DevTools for debugging (only in dev mode)',
          '<code>maxAge: 25</code>: keeps the last 25 actions in memory for debugging',
          'From this moment the store is ready and accessible everywhere!'
        ]
      }
    },
    {
      stepNumber: 7,
      title: '🔍 Create Selectors',
      explanation: 'The <strong>Selectors</strong> are functions that "extract" specific data from the store. They are <strong>memoized</strong>, meaning they cache results to avoid unnecessary calculations.',
      codeExample: {
        title: 'File: store/counter/counter.selectors.ts',
        code: this.centralizedSelectorsCode
      },
      explanationBox: {
        title: '💡 Why use Selectors?',
        points: [
          '<strong>Memoization</strong>: calculates only if state changes, otherwise uses cache',
          '<strong>Reusability</strong>: define once, use everywhere',
          '<strong>Composition</strong>: you can create complex selectors from other selectors',
          '<strong>Type-safety</strong>: TypeScript knows exactly what they return'
        ]
      }
    },
    {
      stepNumber: 8,
      title: '🧩 Use Store in Components',
      explanation: 'Finally! Now we can use the store in components to read state and dispatch actions.',
      codeExample: {
        title: 'File: counter.component.ts',
        code: this.componentCode
      },
      explanationBox: {
        title: '💡 The complete cycle:',
        points: [
          'Component <strong>injects</strong> the Store in the constructor',
          'Uses <code>store.select()</code> to <strong>read</strong> the state (with selector)',
          'Uses <code>store.dispatch()</code> to <strong>send</strong> actions',
          'The reducer <strong>updates</strong> the state',
          'The selector <strong>notifies</strong> the component of the change',
          'The UI <strong>updates</strong> automatically (thanks to the async pipe!)'
        ]
      }
    }
  ];

  // ═══ FEATURE STORE GUIDE STEPS ═══
  featureSteps: GuideStepData[] = [
    {
      stepNumber: 1,
      title: '📋 Define Feature State',
      explanation: 'Unlike the centralized store, each feature defines only its <strong>own</strong> state, without knowing the state of other features. This guarantees complete isolation.',
      codeExample: {
        title: 'File: features/counter/store/counter.state.ts',
        code: this.featureStateCode
      },
      explanationBox: {
        title: '💡 Key differences:',
        points: [
          'No global <code>AppState</code> interface',
          'Each feature is <strong>self-contained</strong>',
          'The state exists only when the module is loaded (lazy-loading)',
          'Perfect for features that never share data'
        ]
      }
    },
    {
      stepNumber: 2,
      title: '⚙️ Create Actions and Reducers (identical to centralized store)',
      explanation: 'Actions and reducers work exactly like in the centralized store. The difference lies in <strong>how</strong> they are registered in the app.',
      codeExample: {
        title: 'File: features/counter/store/counter.reducer.ts',
        code: this.featureReducerCode
      },
      explanationBox: {
        title: '💡 Important note:',
        content: 'The reducer code is identical to the centralized one. The "magic" happens in the registration, which we will see in the next step!'
      }
    },
    {
      stepNumber: 3,
      title: '🌍 Root Store Setup (Empty)',
      explanation: 'With Feature Stores, the root store starts <strong>empty</strong>. Each feature will register dynamically when loaded. This allows loading only the necessary state.',
      codeExample: {
        title: 'File: app.config.ts',
        code: this.featureProvideCode
      },
      explanationBox: {
        title: '💡 Why an empty store?',
        points: [
          '<code>provideStore(&#123;&#125;)</code>: initializes the store without initial state',
          'Features will add their state when needed',
          '<strong>Smaller bundle size</strong> at startup',
          'Perfect for <strong>lazy-loading</strong>: load only what is needed'
        ]
      }
    },
    {
      stepNumber: 4,
      title: '🔌 Register Feature Store (Lazy-Loading)',
      explanation: 'This is the heart of the Feature Store pattern! When a route is loaded, it dynamically registers its state in the store using <code>provideState()</code>.',
      codeExample: {
        title: 'File: features/counter/counter.routes.ts',
        code: this.featureModuleCode
      },
      explanationBox: {
        title: '💡 How does it work?',
        points: [
          'When the user navigates to the route, Angular loads the module',
          '<code>provideState(\'counter\', counterReducer)</code>: registers the state in the store',
          'The \'counter\' state appears dynamically in the global store',
          'When the user leaves the route, the state can be kept or removed'
        ]
      }
    },
    {
      stepNumber: 5,
      title: '🔍 Create Selectors with createFeatureSelector',
      explanation: 'For Feature Stores, we use <code>createFeatureSelector</code> instead of manually selecting from the global state. NgRx knows how to automatically find the correct feature.',
      codeExample: {
        title: 'File: features/counter/store/counter.selectors.ts',
        code: this.featureSelectorCode
      },
      explanationBox: {
        title: '💡 Differences with centralized selectors:',
        points: [
          '<code>createFeatureSelector(\'counter\')</code>: automatically selects the feature',
          'No need to manually define <code>(state: AppState) => state.counter</code>',
          'More concise and self-documenting',
          'The rest works identically (memoization, composition)'
        ]
      }
    },
    {
      stepNumber: 6,
      title: '🧩 Use Store in Components (identical!)',
      explanation: 'The beautiful part? <strong>Components don\'t know the difference!</strong> The code is identical for both centralized store and feature store.',
      codeExample: {
        title: 'File: features/counter/counter.component.ts',
        code: this.componentCode
      },
      explanationBox: {
        title: '💡 Advantages of this abstraction:',
        points: [
          'Same code in components for both patterns',
          'You can <strong>migrate</strong> from feature stores to centralized (or vice versa) easily',
          'Components are decoupled from the store architecture',
          'Identical testability for both approaches'
        ]
      }
    }
  ];

  // ═══ METHODS ═══
  selectPattern(pattern: StorePattern) {
    this.selectedPattern.set(pattern);
    // Scroll to guide section
    setTimeout(() => {
      const element = document.getElementById('pattern-guide');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
}
