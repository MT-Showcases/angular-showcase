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
      { path: '', pathMatch: 'full', data: { category: 'basics' }, loadComponent: () => import('./learning/category/category').then(m => m.LearningCategory) },
      { path: 'getting-started', loadComponent: () => import('./getting-started/getting-started').then(m => m.GettingStarted) },
      { path: 'components', loadComponent: () => import('./component-communication/component-communication').then(m => m.ComponentCommunication) },
      { path: 'pipes', loadComponent: () => import('./pipes/pipes').then(m => m.PipesLesson) },
      { path: 'services', loadComponent: () => import('./services-lesson/services-lesson').then(m => m.ServicesLesson) },
      {
        path: 'routing',
        loadComponent: () => import('./routing-lesson/routing-lesson').then(m => m.RoutingLesson),
        children: [
          { path: '', pathMatch: 'full', children: [] },
          { path: '**', redirectTo: '' },
        ],
      },
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
      { path: '', pathMatch: 'full', data: { category: 'advanced' }, loadComponent: () => import('./learning/category/category').then(m => m.LearningCategory) },
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
        path: '',
        pathMatch: 'full',
        data: { category: 'state' },
        loadComponent: () =>
          import('./learning/category/category').then((module) => module.LearningCategory),
      },
      {
        path: 'rxjs',
        loadComponent: () => import('./rxjs-lesson/rxjs-lesson').then(module => module.RxjsLesson),
      },
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
        path: '',
        pathMatch: 'full',
        data: { category: 'examples' },
        loadComponent: () =>
          import('./learning/category/category').then((module) => module.LearningCategory),
      },
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
