import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { PLAYGROUND_STYLES } from '../learning/playground-styles';

/** Two actual Angular components share one editable TS module in the component runner. */
export const COMMUNICATION_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface VotingOption {
  readonly id: string;
  readonly title: string;
  readonly votes: number;
}

// FIGLIO: riceve dati e invia una richiesta. Non modifica l'oggetto ricevuto.
@Component({
  selector: 'app-vote-card',
  template: \`
    <article>
      <h3>{{ option.title || 'Opzione senza titolo' }}</h3>
      <p>Voti: <strong>{{ option.votes }}</strong></p>

      <button
        type="button"
        [disabled]="disabledReason !== ''"
        [attr.aria-label]="'Vota ' + (option.title || 'opzione senza titolo')"
        (click)="requestVote()"
      >Richiedi un voto</button>

      <p>{{ disabledReason || 'Il padre decide come aggiornare i voti.' }}</p>
    </article>
  \`,
  styles: [\`
    article {
      padding: 1rem;
      border: 1px solid #6746c3;
      border-radius: 0.5rem;
    }

    button {
      min-height: 2.75rem;
      max-width: 100%;
      padding: 0.5rem 0.75rem;
      font: inherit;
      color: #4c318e;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
class VoteCard {
  @Input({ required: true }) option!: VotingOption;
  @Input() disabledReason = '';
  @Output() voteRequested = new EventEmitter<string>();

  requestVote(): void {
    if (!this.disabledReason) this.voteRequested.emit(this.option.id);
  }
}

// PADRE: possiede lo stato e sceglie se accettare l'evento del figlio.
@Component({
  selector: 'app-voting-demo',
  imports: [FormsModule, VoteCard],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class VotingDemo {
  options = this.initialOptions();
  maxVotes = 3;
  paused = false;
  lastRequest = 'nessuna';

  recordVote(id: string): void {
    const option = this.options.find(item => item.id === id);
    if (!option || this.paused || option.votes >= this.maxVotes) return;

    // Sostituiamo il dato del solo elemento votato.
    this.options = this.options.map(item => item.id === id
      ? { ...item, votes: item.votes + 1 }
      : item);
    this.lastRequest = id;
  }

  reasonFor(option: VotingOption): string {
    if (this.paused) return 'Votazione in pausa.';
    return option.votes >= this.maxVotes ? 'Limite raggiunto.' : '';
  }

  rename(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      const title = event.target.value;
      this.options = this.options.map((item, index) => index === 0
        ? { ...item, title }
        : item);
    }
  }

  reset(): void {
    this.options = this.initialOptions();
    this.paused = false;
    this.lastRequest = 'nessuna';
  }

  private initialOptions(): VotingOption[] {
    return [
      { id: 'templates', title: 'Template', votes: 0 },
      { id: 'events', title: 'Eventi', votes: 0 },
    ];
  }
}`,
  html: `<section class="demo">
  <h2>Il padre possiede i voti, il figlio chiede di cambiarli</h2>

  <label>
    Titolo della prima opzione (stato del padre)
    <input id="title" [value]="options[0].title" (input)="rename($event)" />
  </label>

  <!-- [option] invia il dato; (voteRequested) riceve l'ID emesso. -->
  @for (option of options; track option.id) {
    <app-vote-card
      [option]="option"
      [disabledReason]="reasonFor(option)"
      (voteRequested)="recordVote($event)"
    />
  }

  <p id="last-request" class="result" role="status">Ultima richiesta ricevuta: {{ lastRequest }}</p>

  <div class="actions">
    <button id="pause" type="button" [attr.aria-pressed]="paused" (click)="paused = !paused">
      {{ paused ? 'Riprendi votazione' : 'Metti in pausa' }}
    </button>
    <button id="reset" type="button" (click)="reset()">Ripristina demo</button>
  </div>
</section>`,
  css: PLAYGROUND_STYLES,
};
