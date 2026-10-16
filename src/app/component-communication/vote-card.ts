// COMPONENT TYPE: Presentational
// ROLE: Render parent-owned voting data and emit a request without mutating it.
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/** Immutable input contract. Each sibling option has a unique, stable id. */
export interface VotingOption {
  readonly id: string;
  readonly title: string;
  readonly votes: number;
}

/** Reusable child: data enters through inputs, intent leaves through a typed output. */
@Component({
  selector: 'app-vote-card',
  imports: [MatButtonModule],
  templateUrl: './vote-card.html',
  styleUrl: './vote-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteCard {
  readonly option = input.required<VotingOption>();
  readonly disabledReason = input('');
  readonly voteRequested = output<string>();

  requestVote(): void {
    if (!this.disabledReason()) {
      this.voteRequested.emit(this.option().id);
    }
  }
}
