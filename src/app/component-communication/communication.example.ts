import type { PlaygroundSources } from '../components/angular-playground/playground.types';

export const INPUT_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, input, ChangeDetectionStrategy } from '@angular/core';

// FIGLIO: input() dichiara un dato ricevuto dal padre, letto come un signal.
@Component({
  selector: 'app-greeting',
  template: '<h3 id="greeting">Ciao, {{ name() }}!</h3>',
  changeDetection: ChangeDetectionStrategy.Eager,
})
class Greeting {
  // Se il padre non passa un valore, viene usato questo valore iniziale.
  readonly name = input('visitatore');
}

// PADRE: collega il figlio e possiede lo stato della pagina.
@Component({
  selector: 'app-input-demo',
  imports: [Greeting],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class InputDemo {
  // Il padre possiede lo stato; il figlio riceve solo il valore.
  name = 'Ada';
}`,
  html: `<label>
  Nome nello stato del padre
  <input #field id="name" [value]="name" (input)="name = field.value" />
</label>

<!-- Le parentesi quadre passano il valore al figlio: padre → figlio. -->
<app-greeting [name]="name" />`,
  css: `/* Questi stili appartengono al padre; il figlio ha la propria vista. */
label {
  display: grid;
  gap: 0.5rem;
}

input {
  max-width: 100%;
  min-width: 0;
  padding: 0.5rem;
  font: inherit;
}

.result {
  padding: 1rem;
  background: #eee7ff;
}`,
};

export const OUTPUT_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, output, ChangeDetectionStrategy } from '@angular/core';

// FIGLIO: emette un messaggio senza cambiare lo stato del padre.
@Component({
  selector: 'app-message-button',
  template: \`
    <button type="button" (click)="sent.emit('Ciao dal figlio!')">
      Invia un messaggio
    </button>
  \`,
  changeDetection: ChangeDetectionStrategy.Eager,
})
class MessageButton {
  // output() dichiara un evento: emit() trasmette un valore al padre.
  // Non è un signal e non conserva lo stato della pagina.
  readonly sent = output<string>();
}

// PADRE: collega il figlio e possiede lo stato della pagina.
@Component({
  selector: 'app-output-demo',
  imports: [MessageButton],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class OutputDemo {
  // Soltanto il padre decide come usare il messaggio ricevuto.
  message = 'Nessun messaggio ricevuto.';
}`,
  html: `<!-- Le parentesi tonde ascoltano l'evento del figlio. -->
<!-- $event contiene la stringa passata a emit(), non un evento DOM. -->
<app-message-button (sent)="message = $event" />

<p id="message" class="result" role="status">{{ message }}</p>`,
  css: `/* Questi stili appartengono al padre; il figlio ha la propria vista. */
label {
  display: grid;
  gap: 0.5rem;
}

input {
  max-width: 100%;
  min-width: 0;
  padding: 0.5rem;
  font: inherit;
}

.result {
  padding: 1rem;
  background: #eee7ff;
}`,
};

export const COMMUNICATION_EXAMPLE: PlaygroundSources = {
  typescript: `import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-counter-button',
  template: \`
    <button type="button" (click)="incremented.emit()">{{ label() }}</button>
  \`,
  changeDetection: ChangeDetectionStrategy.Eager,
})
class CounterButton {
  // Il testo entra dal padre. La richiesta esce verso il padre.
  readonly label = input('Aggiungi 1');
  readonly incremented = output<void>();
}

// PADRE: collega il figlio e possiede lo stato della pagina.
@Component({
  selector: 'app-combined-demo',
  imports: [CounterButton],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class CombinedDemo {
  // Il contatore appartiene al padre, non al pulsante figlio.
  count = 0;
}`,
  html: `<!-- Il figlio riceve un'etichetta, ma non ha accesso al contatore. -->
<app-counter-button
  [label]="'Aggiungi 1'"
  (incremented)="count = count + 1"
/>

<p id="count" class="result" role="status">Totale: {{ count }}</p>

<!-- Togli il gestore (incremented): il clic non cambierà più il totale. -->
<button id="reset" type="button" (click)="count = 0">Ripristina</button>`,
  css: `/* Questi stili appartengono al padre; il figlio ha la propria vista. */
label {
  display: grid;
  gap: 0.5rem;
}

input {
  max-width: 100%;
  min-width: 0;
  padding: 0.5rem;
  font: inherit;
}

.result {
  padding: 1rem;
  background: #eee7ff;
}`,
};
