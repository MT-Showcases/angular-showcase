/**
 * Stable course samples shared by every exercise checkpoint.
 *
 * Dates are fixed UTC strings so the preview does not depend on the local
 * clock or timezone. The array is only source material: the playground never
 * sends these values over HTTP or saves them.
 */
export interface CourseSample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly price: number;
  readonly startDate: string;
  readonly tags: readonly string[];
  readonly available: boolean;
}

export const COURSE_SAMPLES: readonly CourseSample[] = [
  {
    id: 'angular-fondamenti',
    title: 'Angular: fondamenti',
    description: 'Componenti, template e binding per costruire la prima vista.',
    price: 149,
    startDate: '2026-11-09T09:00:00Z',
    tags: ['Angular', 'Basi'],
    available: true,
  },
  {
    id: 'typescript-avanzato',
    title: 'TypeScript avanzato',
    description: 'Tipi, generics e narrowing nel codice di ogni giorno.',
    price: 199,
    startDate: '2026-11-16T09:00:00Z',
    tags: ['TypeScript', 'Tipi'],
    available: true,
  },
  {
    id: 'material-design',
    title: 'Angular Material',
    description: 'Componenti accessibili e design token condivisi.',
    price: 179,
    startDate: '2026-12-07T09:00:00Z',
    tags: ['Material', 'Design'],
    available: false,
  },
  {
    id: 'test-qualita',
    title: 'Test e qualità',
    description: 'Unit test, component test e fiducia nel rilascio.',
    price: 129,
    startDate: '2027-01-18T09:00:00Z',
    tags: ['Test', 'Qualità'],
    available: true,
  },
];
