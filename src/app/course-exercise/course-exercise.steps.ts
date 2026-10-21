import { COURSE_SAMPLES } from './course-exercise.data';

/** One shell command shown next to the step that needs it. */
export interface AssignmentCommand {
  readonly label: string;
  readonly command: string;
}

/** One cumulative step of the local assignment; it contains no solution code. */
export interface CourseAssignmentStep {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly goal: string;
  readonly requirements: readonly string[];
  readonly checks: readonly string[];
  readonly hints: readonly string[];
  readonly commands?: readonly AssignmentCommand[];
}

/** Environment setup, run from a folder outside any other Angular workspace. */
export const SETUP_COMMANDS: readonly AssignmentCommand[] = [
  {
    label: 'Crea il progetto standalone con Angular CLI 22',
    command: 'npx @angular/cli@22 new catalogo-corsi --standalone --routing=false --style=scss --defaults',
  },
  {
    label: 'Entra nella cartella appena creata',
    command: 'cd catalogo-corsi',
  },
  {
    label: 'Aggiungi Angular Material scegliendo un preset del tema',
    command: 'npx ng add @angular/material@22',
  },
  {
    label: 'Avvia il progetto su una porta libera, diversa da 4200',
    command: 'npm start -- --port 4201',
  },
];

/** Final structure produced by the assignment inside the generated project. */
export const PROJECT_TREE = `catalogo-corsi/
└── src/app/
    ├── app.ts
    ├── app.html
    ├── app.scss
    ├── models/
    │   └── course.ts
    ├── components/
    │   └── course-card/
    │       ├── course-card.ts
    │       └── course-card.scss
    └── pipes/
        └── tags-pipe.ts`;

/** Model to copy into src/app/models/course.ts before writing components. */
export const COURSE_MODEL_SNIPPET = `// Modello condiviso tra elenco e scheda corso.
export interface Course {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly price: number;
  readonly startDate: string;
  readonly tags: readonly string[];
  readonly available: boolean;
}`;

const COURSE_DATA = JSON.stringify(COURSE_SAMPLES, null, 2);

/** Four fixed samples; USD prices and UTC dates keep results deterministic. */
export const COURSE_DATA_SNIPPET = `// Quattro corsi di esempio: prezzi in dollari USA e date UTC stabili.
export const COURSE_SAMPLES: readonly Course[] = ${COURSE_DATA};`;

export const COURSE_ASSIGNMENT_STEPS: readonly CourseAssignmentStep[] = [
  {
    id: 'step-1',
    label: 'Passo 1',
    title: 'Una scheda con dati reali',
    goal: 'Mostra un corso completo partendo dal modello e dai dati forniti, senza ancora creare componenti figli.',
    requirements: [
      'Copia modello e campioni in `src/app/models/course.ts`, mantenendo prezzi e date esattamente come forniti.',
      'In `app.ts` importa `Course` e `COURSE_SAMPLES` e assegna il primo corso a una proprietà tipizzata.',
      'In `app.html` interpola `title`, `description`, `price`, `startDate`, `tags` e `available` dentro una sola scheda.',
      'Scrivi le etichette in italiano e descrivi la disponibilità a parole, non soltanto con un colore.',
    ],
    checks: [
      'Aprendo `http://localhost:4201` vedi una sola scheda con «Angular: fondamenti».',
      'Titolo, descrizione, prezzo, data, tag e disponibilità corrispondono al primo campione.',
      'Prezzo e data sono ancora valori grezzi: la formattazione arriva al passo 5.',
    ],
    hints: [
      'Parti da una sola interpolazione e aggiungine una alla volta.',
      'Leggi `course.available` e scegli con un’espressione condizionale tra **Disponibile** e **Non disponibile**.',
    ],
  },
  {
    id: 'step-2',
    label: 'Passo 2',
    title: 'Selezione con stato locale',
    goal: 'Aggiungi uno stato locale che evidenzia la scheda e comunica la selezione anche a chi usa la tastiera.',
    requirements: [
      'Crea una proprietà booleana `selected` nel componente per sapere se la scheda è selezionata.',
      'Attiva e disattiva lo stato con il click su un vero pulsante; il contenuto della scheda resta invariato.',
      'Usa un binding di classe o di proprietà per cambiare aspetto quando lo stato è attivo.',
      'Collega lo stato a `[attr.aria-pressed]` e cambia il testo del pulsante tra seleziona e deseleziona.',
      'Non manipolare il DOM a mano e non usare un `div` cliccabile al posto del pulsante.',
    ],
    checks: [
      'Un click sul pulsante cambia bordo o sfondo della scheda e un secondo click ripristina l’aspetto.',
      '`aria-pressed` vale `true` quando la scheda è selezionata e `false` quando non lo è.',
      'Il testo del pulsante descrive l’azione successiva.',
      'Il pulsante funziona con Invio e con la barra spaziatrice.',
    ],
    hints: [
      'Un pulsante nativo offre già focus, Invio e barra spaziatrice: non serve aggiungere gestori di tastiera.',
      'Il binding di attributo e quello di classe possono leggere la stessa proprietà `selected`.',
    ],
  },
  {
    id: 'step-3',
    label: 'Passo 3',
    title: 'Catalogo, @for e @if',
    goal: 'Trasforma la scheda singola in un elenco completo, con stati di disponibilità e di catalogo vuoto.',
    requirements: [
      'Assegna l’intero array `COURSE_SAMPLES` a una proprietà del componente.',
      'Ripeti la scheda con `@for` e traccia ogni corso con `course.id`, non con l’indice.',
      'Dentro ogni scheda usa `@if` per i corsi disponibili e `@else` per gli altri, con testi distinti.',
      'Aggiungi un blocco `@empty` al ciclo e due pulsanti reali: uno svuota il catalogo, l’altro lo ripristina.',
      'Mantieni pulsante ed evidenziazione: nel padre usa ora `selectedId` per distinguere il corso scelto. Il componente figlio arriva al passo 4.',
      'Ripristina riassegnando una copia dei campioni e non modificare l’array importato.',
    ],
    checks: [
      'Vedi quattro schede nell’ordine dei campioni, senza duplicati.',
      'Il corso «Angular Material» mostra lo stato non disponibile tramite `@else`.',
      'Svuotando l’elenco compare il messaggio di `@empty`; ripristinando tornano le quattro schede.',
      'Selezionando un corso si evidenzia solo quella scheda; scegliendone un altro cambia la selezione.',
      'Prezzo, data e tag restano identici ai valori forniti.',
    ],
    hints: [
      '`@empty` segue la graffa che chiude il corpo di `@for`: viene mostrato quando la collezione è vuota.',
      'Per ripristinare puoi riassegnare una copia di `COURSE_SAMPLES`: il campione originale resta intatto.',
    ],
  },
  {
    id: 'step-4',
    label: 'Passo 4',
    title: 'CourseCard con input e output',
    goal: 'Estrai la scheda in un componente figlio e collega padre e figlio con input e output.',
    requirements: [
      'Genera `CourseCard` con template inline e senza file di test, poi usa il selettore `app-course-card`.',
      'Nel figlio ricevi il corso con `input.required<Course>()` e uno stato di selezione con un secondo input chiamato `selected`.',
      'Nel figlio dichiara un `output<string>()` chiamato `courseSelected` che emette l’`id` del corso quando la scheda viene attivata.',
      'Nel padre conserva l’array e un `selectedId`; passa ogni corso al figlio e aggiorna l’ID alla ricezione dell’evento.',
      'Mostra nel padre il titolo del corso scelto e mantieni i controlli di catalogo e disponibilità.',
      'Tieni il template breve dentro `course-card.ts` e gli stili in `course-card.scss`.',
    ],
    checks: [
      '`app.html` usa `app-course-card` per ogni corso e non contiene più il markup completo della scheda.',
      'Il click su una scheda aggiorna il titolo scelto nel padre e mantiene evidenziazione e `aria-pressed`.',
      'Svuotare e ripristinare il catalogo continua a funzionare, così come i testi di disponibilità.',
      'Omettere l’input obbligatorio del corso produce un errore di compilazione.',
    ],
    hints: [
      'Chiama `input.required<Course>()` nell’inizializzatore di un campo, poi leggi il signal nel template.',
      'Dal figlio emetti solo l’ID; il padre resta l’unico proprietario della selezione.',
    ],
    commands: [
      {
        label: 'Dalla cartella catalogo-corsi, genera la scheda con template inline',
        command: 'npx ng generate component components/course-card --inline-template --skip-tests',
      },
    ],
  },
  {
    id: 'step-5',
    label: 'Passo 5',
    title: 'Pipe per prezzo, data, titolo e tag',
    goal: 'Formatta i valori nella scheda con le pipe Angular e con una pipe personale pura per i tag.',
    requirements: [
      'Genera la pipe dei tag e chiamala `TagsPipe`, con nome `tags` e file `pipes/tags-pipe.ts`.',
      'Formatta il prezzo con `CurrencyPipe` in `USD` e locale `en-US`: è solo formattazione, non conversione valutaria.',
      'Formatta la data con `DatePipe` e con il fuso `UTC`, in un formato numerico stabile come `dd/MM/yyyy`; non usare l’ora locale del computer.',
      'Mostra il titolo con `UpperCasePipe`.',
      'Nella `TagsPipe` unisci i tag con un separatore, gestisci l’array vuoto e non ordinarli né modificarli.',
      'Lascia la pipe pura e importa tutte le pipe usate nel campo `imports` di `CourseCard`.',
      'Mantieni selezione, output verso il padre, disponibilità e controlli del catalogo.',
    ],
    checks: [
      'Il prezzo del primo corso appare come `$149.00`, non come importo in euro.',
      'La data appare come `09/11/2026` anche cambiando il fuso del computer.',
      'Il titolo è maiuscolo e i tag sono separati da ` · `.',
      'La lunghezza dell’array dei tag non cambia dopo il rendering e l’ordine resta quello fornito.',
      'Selezione, catalogo vuoto e ripristino funzionano ancora; `npm run build` termina senza errori.',
    ],
    hints: [
      'Le pipe usate in un componente standalone vanno elencate nel suo `imports`.',
      'Per non mutare l’array, limita la pipe a una lettura e a una `join` con il separatore ricevuto.',
    ],
    commands: [
      {
        label: 'Dalla cartella catalogo-corsi, genera la pipe personale',
        command: 'npx ng generate pipe pipes/tags --skip-tests',
      },
    ],
  },
];
