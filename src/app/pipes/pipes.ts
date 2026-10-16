// COMPONENT TYPE: Container
// SECTION: Angular Basics
// ROLE: Compare source values with built-in and custom pipe results.
// PATTERNS USED: Signals for local controls, explicit locale/timezone and immutable list updates.
// NOTES FOR CONTRIBUTORS: Formatting must not mutate data; keep locale setup visible to learners.
import { CurrencyPipe, DatePipe, JsonPipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { TagListPipe } from './tag-list-pipe';

@Component({
  selector: 'app-pipes-lesson',
  imports: [CurrencyPipe, DatePipe, JsonPipe, UpperCasePipe, RouterLink, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, CodeBlock, LessonDisclosure, LessonShell, TagListPipe],
  templateUrl: './pipes.html',
  styleUrl: './pipes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PipesLesson {
  readonly timestamp = '2026-10-16T10:30:00Z';
  readonly dateFormat = signal('yyyy-MM-dd');
  readonly timezone = signal('UTC');
  readonly amount = signal<number | null>(1234.5);
  readonly currency = signal('EUR');
  readonly currencyDisplay = signal('symbol');
  readonly text = signal('Angular si impara provando');
  readonly labels = signal<readonly string[]>(['template', 'dati']);
  readonly separator = signal(' · ');
  readonly newLabel = signal('');
  readonly status = signal('Modifica i parametri e confronta dati e presentazione.');

  readonly setupCode = `// pipes.ts — imports and initial values
import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TagListPipe } from './tag-list-pipe';

@Component({
  selector: 'app-format-demo',
  imports: [CurrencyPipe, DatePipe, UpperCasePipe, TagListPipe],
  templateUrl: './format-demo.html',
})
export class FormatDemo {
  timestamp = '2026-10-16T10:30:00Z';
  dateFormat = signal('yyyy-MM-dd');
  timezone = signal('UTC');
  amount = signal(1234.5);
  currency = signal('EUR');
  currencyDisplay = signal('symbol');
  text = signal('Angular si impara provando');
  labels = signal<readonly string[]>(['template', 'dati']);
  separator = signal(' · ');
}`;
  readonly templateCode = `<!-- format-demo.html — source values remain unchanged -->
<p>{{ timestamp }}</p>
<p>{{ timestamp | date:dateFormat():timezone():'en-US' }}</p>
<p>{{ amount() | currency:currency():currencyDisplay():'1.2-2':'en-US' }}</p>
<p>{{ text() | uppercase }}</p>
<p>{{ labels() | tagList:separator() }}</p>`;
  readonly customCode = `// tag-list-pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tagList', pure: true })
export class TagListPipe implements PipeTransform {
  transform(labels: readonly string[], separator = ' · '): string {
    return labels.join(separator);
  }
}`;
  readonly immutableCode = `// Inside FormatDemo: replace the array to change its reference.
addLabel(label: string): void {
  const value = label.trim();
  if (!value) return;
  this.labels.update(labels => [...labels, value]);
}
// Do not mutate the existing array with labels.push(value).`;

  updateAmount(value: number): void {
    this.amount.set(Number.isFinite(value) ? value : null);
  }

  addLabel(): void {
    const value = this.newLabel().trim();
    if (!value || value.length > 40) return;
    this.labels.update(labels => [...labels, value]);
    this.newLabel.set('');
    this.status.set(`Etichetta ${value} aggiunta creando un nuovo array.`);
  }

  reset(): void {
    this.dateFormat.set('yyyy-MM-dd');
    this.timezone.set('UTC');
    this.amount.set(1234.5);
    this.currency.set('EUR');
    this.currencyDisplay.set('symbol');
    this.text.set('Angular si impara provando');
    this.labels.set(['template', 'dati']);
    this.separator.set(' · ');
    this.newLabel.set('');
    this.status.set('Valori e parametri iniziali ripristinati.');
  }
}
