import { Routes } from '@angular/router';
import { UserList } from './user-list/user-list';
import { DataBinding } from './data-binding/data-binding';
import { Directives } from './directives/directives';
import { Home } from './home/home';
import { Forms } from './forms/forms';
import { UserPage } from './user-page/user-page';
import { Signals } from './signals/signals';
import { HttpExample } from './http-example/http-example';
import { NgrxExample } from './ngrx-example/ngrx-example';
import { CodeBlockDemo } from './code-block-demo/code-block-demo';
import { BehaviorSubjectComponent } from './behavior-subject/behavior-subject';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'basics',
    children: [
      {
        path: 'data-binding',
        component: DataBinding,
      },
      {
        path: 'directives',
        component: Directives,
      },
      {
        path: 'forms',
        component: Forms,
      },
    ],
  },
  {
    path: 'advanced',
    children: [
      {
        path: 'signals',
        component: Signals,
      },
      {
        path: 'http',
        component: HttpExample,
      },
    ],
  },
  {
    path: 'state',
    children: [
      {
        path: 'ngrx',
        component: NgrxExample,
      },
      {
        path: 'behavior-subject',
        component: BehaviorSubjectComponent,
      },
    ],
  },
  {
    path: 'examples',
    children: [
      {
        path: 'users',
        component: UserPage,
      },
    ],
  },
  {
    path: 'code-block-demo',
    component: CodeBlockDemo,
  },
];
