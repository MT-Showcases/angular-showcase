import { Routes } from '@angular/router';
import { Home } from './home/home';

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
        loadComponent: () =>
          import('./data-binding/data-binding').then((module) => module.DataBinding),
      },
      {
        path: 'directives',
        loadComponent: () => import('./directives/directives').then((module) => module.Directives),
      },
      {
        path: 'forms',
        loadComponent: () => import('./forms/forms').then((module) => module.Forms),
      },
    ],
  },
  {
    path: 'advanced',
    children: [
      {
        path: 'signals',
        loadComponent: () => import('./signals/signals').then((module) => module.Signals),
      },
      {
        path: 'http',
        loadComponent: () =>
          import('./http-example/http-example').then((module) => module.HttpExample),
      },
    ],
  },
  {
    path: 'state',
    children: [
      {
        path: 'ngrx',
        loadComponent: () =>
          import('./ngrx-example/ngrx-example').then((module) => module.NgrxExample),
      },
      {
        path: 'behavior-subject',
        loadComponent: () =>
          import('./behavior-subject/behavior-subject').then(
            (module) => module.BehaviorSubjectComponent,
          ),
      },
    ],
  },
  {
    path: 'examples',
    children: [
      {
        path: 'users',
        loadComponent: () => import('./user-page/user-page').then((module) => module.UserPage),
      },
    ],
  },
  {
    path: 'design-system',
    loadComponent: () => import('./design-system/design-system').then((module) => module.DesignSystem),
  },
  {
    path: 'code-block-demo',
    loadComponent: () =>
      import('./code-block-demo/code-block-demo').then((module) => module.CodeBlockDemo),
  },
];
