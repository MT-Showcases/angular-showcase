// COMPONENT TYPE: Container
// SECTION: Component Showcase
//
// ROLE:
// - Demonstrate CodeBlock component with various languages
// - Provide example code snippets for syntax highlighting
// - Showcase copy-to-clipboard functionality
//
// PATTERNS USED:
// - Container component with example data
// - Static code string examples
// - Multi-language code demonstration
//
// NOTES FOR CONTRIBUTORS:
// - Add new language examples as properties
// - Keep code examples realistic and educational
// - Escape template literals properly with \`
// - This is a demo page, not a route in main navigation

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PageHeader } from '../page-header/page-header';
import { CodeBlock } from '../components/code-block/code-block';

@Component({
  selector: 'app-code-block-demo',
  standalone: true,
  imports: [PageHeader, CodeBlock],
  templateUrl: './code-block-demo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./code-block-demo.scss'],
})
export class CodeBlockDemo {
  typescriptExample = `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-example',
  standalone: true,
  template: \`
    <div class="container">
      <h1>{{ title() }}</h1>
      <button (click)="increment()">Count: {{ count() }}</button>
    </div>
  \`
})

export class ExampleComponent {
  title = signal('Hello Angular!');
  count = signal(0);

  increment() {
    this.count.update(c => c + 1);
  }
}`;

  htmlExample = `<div class="user-profile">
  @if (user()) {
    <div class="user-card">
      <img [src]="user().avatar" [alt]="user().name" />
      <h2>{{ user().name }}</h2>
      <p>{{ user().email }}</p>

      @for (badge of user().badges; track badge.id) {
        <span class="badge">{{ badge.name }}</span>
      }
    </div>
  } @else {
    <div class="loading">Loading user...</div>
  }
</div>`;

  cssExample = `.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-4px);
    transition: transform 0.3s ease;
  }

  .card-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
  }
}`;

  jsonExample = `{
  "name": "angular-app",
  "version": "18.0.0",
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test"
  },
  "dependencies": {
    "@angular/core": "^18.0.0",
    "@ngrx/store": "^18.0.0",
    "rxjs": "^7.8.0"
  },
  "devDependencies": {
    "@angular/cli": "^18.0.0",
    "typescript": "~5.4.0"
  }
}`;

  complexExample = `// Advanced NgRx Example with Effects
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, switchMap, catchError, withLatestFrom } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class UserEffects {

  // Load users from API
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUsers),
      withLatestFrom(this.store.select(selectCurrentPage)),
      switchMap(([action, page]) =>
        this.userService.getUsers(page).pipe(
          map(users => UserActions.loadUsersSuccess({ users })),
          catchError(error => of(UserActions.loadUsersFailure({ error })))
        )
      )
    )
  );

  // Save user with optimistic update
  saveUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.saveUser),
      switchMap(action =>
        this.userService.saveUser(action.user).pipe(
          map(user => UserActions.saveUserSuccess({ user })),
          catchError(error => of(UserActions.saveUserFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private userService: UserService
  ) {}
}`;
}
