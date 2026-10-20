import type { LessonDiagramData } from '../components/lesson-diagram/lesson-diagram';

const INITIAL_SCHEMA_NOTE = 'Schema della configurazione iniziale. Gli errori descritti compaiono dopo il blur; nessun invio raggiunge un server.';

/** One control, its validators and the interaction states behind the error. */
export const CONTROL_DIAGRAM: LessonDiagramData = {
  title: 'Un controllo, il suo valore e i suoi stati',
  description: '`name` è un `FormControl` con `Validators.required`. Il campo è collegato con `[formControl]`; l’errore compare quando il campo è **vuoto e touched**, dopo il blur.',
  groups: [
    {
      title: 'Controllo e validazione',
      steps: [
        {
          nodes: [
            { id: 'control-state', label: 'Controllo con valore iniziale', file: 'component.ts', detail: "`new FormControl('Ada', { validators: [Validators.required] })`" },
          ],
          connection: { direction: 'down', label: 'il template collega il campo' },
        },
        {
          nodes: [
            { id: 'control-field', label: 'Campo ed errore condizionale', file: 'component.html', detail: "`[formControl]=\"name\"` e `@if (name.touched && name.hasError('required'))`" },
          ],
        },
      ],
    },
    {
      title: 'Dirty e touched non sono lo stesso stato',
      steps: [
        {
          nodes: [
            { id: 'control-dirty', label: 'Scrittura nel campo', file: 'component.html', detail: '`dirty` diventa `true` modificando il campo dalla vista' },
            { id: 'control-touched', label: 'Uscita dal campo', file: 'component.html', detail: '`touched` diventa `true` dopo il blur' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};

/** A typed group with conditional errors, raw values and a local-only submit. */
export const CONTACT_DIAGRAM: LessonDiagramData = {
  title: 'Un gruppo valida, l’invio resta locale',
  description: '`contactForm` è un `FormGroup` con validatori reali. Gli errori compaiono dopo il blur; il pulsante usa `[disabled]="contactForm.invalid"` e `submit()` crea una **copia locale**, senza richieste di rete.',
  groups: [
    {
      title: 'Validazione, valori e invio',
      steps: [
        {
          nodes: [
            { id: 'contact-group', label: 'Gruppo e validatori', file: 'component.ts', detail: '`Validators.required`, `nonBlank`, `Validators.email`' },
            { id: 'contact-validator', label: 'Validatore personalizzato', file: 'non-blank.validator.ts', detail: '`nonBlank` rifiuta i nomi composti solo da spazi' },
          ],
          connection: { direction: 'down', label: 'il template collega i campi' },
        },
        {
          nodes: [
            { id: 'contact-fields', label: 'Campi ed errori condizionali', file: 'component.html', detail: "`[formGroup]=\"contactForm\"` e `@if (contactForm.controls.name.touched && contactForm.controls.name.hasError('required'))`" },
          ],
          connection: { direction: 'down', label: 'invio consentito solo se valido' },
        },
        {
          nodes: [
            { id: 'contact-submit', label: 'Invio locale e valori raw', file: 'component.ts', detail: '`submit()` usa `getRawValue()`; `organization` disabilitata resta fuori da `value`' },
          ],
        },
      ],
    },
  ],
  note: INITIAL_SCHEMA_NOTE,
};
