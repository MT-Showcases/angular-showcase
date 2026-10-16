// COMPONENT TYPE: Container
// SECTION: Angular Basics
// ROLE: Own voting state and connect reusable children through typed inputs/outputs.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { VoteCard, VotingOption } from './vote-card';

function initialOptions(): VotingOption[] {
  return [
    { id: 'templates', title: 'Template', votes: 0 },
    { id: 'events', title: 'Eventi', votes: 0 },
  ];
}

@Component({
  selector: 'app-component-communication',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, VoteCard, CodeBlock, LessonDisclosure, LessonShell],
  templateUrl: './component-communication.html',
  styleUrl: './component-communication.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ComponentCommunication {
  options = initialOptions();
  readonly maxVotes = 3;
  votingPaused = false;
  lastRequest: string | null = null;
  handledRequests = 0;
  status = '';

  readonly childExample = `// Complete minimal child: vote-card.ts
import { Component, input, output } from '@angular/core';

export interface VotingOption {
  readonly id: string;
  readonly title: string;
  readonly votes: number;
}

@Component({
  selector: 'app-vote-card',
  template: \`
    <h3>{{ option().title || 'Opzione senza titolo' }}</h3>
    <p>Voti ricevuti dal padre: {{ option().votes }}</p>
    <button type="button" [disabled]="disabledReason() !== ''"
      [attr.aria-label]="'Vota ' + (option().title || 'opzione senza titolo')"
      (click)="requestVote()">Richiedi un voto</button>
    <p>{{ disabledReason() || 'Il padre decide come aggiornare i voti.' }}</p>
  \`,
})
export class VoteCard {
  readonly option = input.required<VotingOption>();
  readonly disabledReason = input('');
  readonly voteRequested = output<string>();

  requestVote(): void {
    if (!this.disabledReason()) this.voteRequested.emit(this.option().id);
  }
}`;
  readonly parentExample = `// Complete minimal parent: voting-demo.ts, beside vote-card.ts.
import { Component } from '@angular/core';
import { VoteCard, VotingOption } from './vote-card';

@Component({
  selector: 'app-voting-demo',
  imports: [VoteCard],
  template: \`
    @for (option of options; track option.id) {
      <app-vote-card [option]="option"
        [disabledReason]="option.votes >= 3 ? 'Limite di 3 voti raggiunto.' : ''"
        (voteRequested)="recordVote($event)" />
    }
    <p>Ultima richiesta: {{ lastRequest || 'nessuna' }}</p>
    <button type="button" (click)="reset()">Ripristina tutto</button>
  \`,
})
export class VotingDemo {
  options: VotingOption[] = this.initialOptions();
  lastRequest: string | null = null;

  recordVote(id: string): void {
    const target = this.options.find(option => option.id === id);
    if (!target || target.votes >= 3) return;
    this.options = this.options.map(option => option.id === id
      ? { ...option, votes: option.votes + 1 } : option);
    this.lastRequest = id;
  }

  reset(): void {
    this.options = this.initialOptions();
    this.lastRequest = null;
  }

  private initialOptions(): VotingOption[] {
    return [
      { id: 'templates', title: 'Template', votes: 0 },
      { id: 'events', title: 'Eventi', votes: 0 },
    ];
  }
}`;
  readonly renameExample = `// Fragment from the parent class. Event is the DOM event from its title input.
renameFirst(event: Event): void {
  if (event.target instanceof HTMLInputElement) {
    const title = event.target.value;
    this.options = this.options.map((option, index) => index === 0
      ? { ...option, title } : option);
  }
}
// Parent template fragment:
// <input [value]="options[0].title" (input)="renameFirst($event)" />`;

  renameFirst(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      const title = event.target.value;
      this.options = this.options.map((option, index) => index === 0
        ? { ...option, title } : option);
    }
  }

  reasonFor(option: VotingOption): string {
    if (this.votingPaused) return 'Votazione in pausa.';
    return option.votes >= this.maxVotes ? 'Limite di 3 voti raggiunto.' : '';
  }

  recordVote(id: string): void {
    const target = this.options.find(option => option.id === id);
    if (!target || this.votingPaused || target.votes >= this.maxVotes) return;
    // Replace the selected input object; the child never modifies parent-owned data.
    this.options = this.options.map(option => option.id === id
      ? { ...option, votes: option.votes + 1 } : option);
    this.lastRequest = id;
    this.handledRequests += 1;
    this.status = `Richiesta ${id} ricevuta: il padre ha aggiornato i voti.`;
  }

  togglePause(): void {
    this.votingPaused = !this.votingPaused;
    this.status = this.votingPaused ? 'Votazione in pausa: richieste disabilitate.' : 'Votazione ripresa.';
  }

  reset(): void {
    this.options = initialOptions();
    this.votingPaused = false;
    this.lastRequest = null;
    this.handledRequests = 0;
    this.status = 'Demo ripristinata: titoli iniziali, zero voti e votazione attiva.';
  }
}
