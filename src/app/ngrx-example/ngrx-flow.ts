// COMPONENT TYPE: Shared lesson UI
// ROLE: Explain the generic NgRx cycle through six selectable teaching roles.
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LessonInline } from '../components/lesson-inline/lesson-inline';

/** One ordered role in the general NgRx cycle. */
export interface NgrxFlowStep {
  id: string;
  label: string;
  hint: string;
  summary: string;
  example: string;
  note: string;
  /** Short label for the arrow that leaves this step. */
  connection?: string;
}

/** The mandatory chain only; effects, DevTools and metaReducers stay outside it. */
export const NGRX_FLOW_STEPS: readonly NgrxFlowStep[] = [
  {
    id: 'component',
    label: 'Interazione / componente',
    hint: 'clic o input',
    summary:
      'Un clic o un input nel componente avvia il giro. Il gestore dell’evento descrive l’intenzione e invia un’azione; non modifica lo stato condiviso.',
    example: `// Contatore illustrativo: il clic prepara l’azione
increment() {
  this.store.dispatch(CounterActions.increment());
}`,
    note: 'Il componente non chiama direttamente il reducer e non calcola il nuovo conteggio.',
    connection: 'dispatch dell’azione',
  },
  {
    id: 'action',
    label: 'Action',
    hint: 'type + dati opzionali',
    summary:
      'L’**azione** descrive un evento: `type` lo identifica; gli eventuali campi aggiuntivi trasportano i dati, detti **payload**.',
    example: `// L’incremento del playground non richiede dati aggiuntivi
{ type: '[Counter] increment' }`,
    note: 'Nei Todo, per esempio, `title` è un campo del payload. L’azione da sola non modifica lo stato: decide il reducer.',
    connection: 'il reducer riceve l’azione',
  },
  {
    id: 'reducer',
    label: 'Reducer',
    hint: 'stato precedente + azione',
    summary:
      'Il **reducer** è una **funzione pura**: riceve lo stato precedente e l’azione, poi restituisce un nuovo stato senza modificare il precedente.',
    example: `// Questa regola gestisce soltanto l’azione di incremento
on(CounterActions.increment, state => ({
  count: state.count + 1,
}))

// Feature: { count: 0 } → { count: 1 }`,
    note: 'Il reducer non chiama i selector e non conosce il template: calcola solo il prossimo stato.',
    connection: 'nuovo stato nello Store',
  },
  {
    id: 'store',
    label: 'Stato nello Store',
    hint: 'fonte unica di verità',
    summary:
      'Lo Store conserva lo stato condiviso. `store.dispatch(action)` riceve l’azione e invoca i reducer; quando hanno finito, lo Store contiene il nuovo stato.',
    example: `// Stato illustrativo dopo il reducer
{ counter: { count: 1 } }`,
    note: 'Il componente legge lo Store, ma non lo modifica direttamente: `dispatch` è la porta d’ingresso.',
    connection: 'il selector legge lo Store',
  },
  {
    id: 'selector',
    label: 'Selector',
    hint: 'lettura derivata',
    summary:
      'Un selector è una funzione pura di lettura: ricava dallo stato solo i dati che servono alla vista. Non scrive mai nello Store.',
    example: `// La feature counter è stata selezionata da selectCounterState
const selectCount = createSelector(
  selectCounterState,
  state => state.count,
);

// Dal conteggio corrente ricaviamo 1`,
    note: 'Più componenti possono usare lo stesso selector: derivano i dati senza mantenerne copie modificabili da sincronizzare.',
    connection: 'il template mostra il risultato',
  },
  {
    id: 'template',
    label: 'Template',
    hint: 'mostra e raccoglie',
    summary:
      'Il template legge il risultato del selector, per esempio con `selectSignal` o l’`AsyncPipe`, e mostra il nuovo stato. Da qui parte la prossima interazione.',
    example: `<p>Conteggio: {{ count() }}</p>

<!-- Illustrativo: count() viene da selectSignal e mostra 1 -->`,
    note: 'La vista non calcola lo stato: lo presenta e raccoglie un nuovo evento.',
  },
];

const LEAD =
  'Il flusso è **unidirezionale**: il componente invia un’**azione**, il **reducer** calcola, lo **Store** conserva, il **selector** legge e il template mostra. Seleziona un ruolo per la definizione e l’esempio.';

const RULES = [
  '`store.dispatch(action)` riceve l’azione e invoca i reducer.',
  'Il reducer calcola il prossimo stato e non chiama i selector.',
  'Il selector legge lo Store e non lo modifica mai.',
] as const;

const EFFECTS_NOTE =
  'Un **effect** è opzionale: reagisce a un’azione per svolgere lavoro asincrono, come una richiesta HTTP, e al termine può inviare una nuova azione di successo o di errore. Non è un passo obbligatorio del ciclo.';

const LOOP_NOTE =
  'Il template mostra lo stato; la prossima interazione riparte dal componente e invia una nuova azione: il ciclo ricomincia.';

/**
 * Host-only mental-model section. Selection only changes this explanation;
 * it never touches the editable previews or creates a real Store.
 */
@Component({
  selector: 'app-ngrx-flow',
  imports: [LessonInline, MatButtonModule, MatIconModule, NgTemplateOutlet],
  templateUrl: './ngrx-flow.html',
  styleUrl: './ngrx-flow.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgrxFlow {
  readonly steps = NGRX_FLOW_STEPS;
  readonly lead = LEAD;
  readonly rules = RULES;
  readonly effectsNote = EFFECTS_NOTE;
  readonly loopNote = LOOP_NOTE;
  readonly detailId = 'ngrx-flow-detail';
  readonly selectedId = signal(NGRX_FLOW_STEPS[0].id);
  readonly selected = computed(
    () => this.steps.find(step => step.id === this.selectedId()) ?? this.steps[0],
  );
  readonly selectedIndex = computed(() => {
    const index = this.steps.findIndex(step => step.id === this.selectedId());
    return index < 0 ? 0 : index;
  });

  isSelected(step: NgrxFlowStep): boolean {
    return step.id === this.selectedId();
  }

  stepAppearance(step: NgrxFlowStep): 'tonal' | 'outlined' {
    return this.isSelected(step) ? 'tonal' : 'outlined';
  }

  select(id: string): void {
    this.selectedId.set(id);
  }
}
