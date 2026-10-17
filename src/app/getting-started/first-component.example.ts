import type { PlaygroundSources } from '../components/angular-playground/playground.types';

/** The editable source is also the source executed by the preview. */
export const FIRST_COMPONENT: PlaygroundSources = {
  typescript: `import { Component, ChangeDetectionStrategy } from '@angular/core';

// Collega questa classe al template e al foglio di stile.
@Component({
  selector: 'app-welcome-card',
  templateUrl: './component.html',
  styleUrl: './component.css',

  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class WelcomeCard {
  // Modifica questo testo e osserva il titolo nella preview.
  message = 'Ciao, Angular!';

  // Ogni clic su "Aggiungi 1" incrementa questo valore.
  count = 0;

  // Il template usa questo booleano per attivare una classe CSS.
  highlighted = false;
}`,
  html: `<!-- Collega una classe CSS allo stato highlighted del componente. -->
<section class="card" [class.card--highlighted]="highlighted">
  <span class="eyebrow">IL TUO PRIMO COMPONENTE</span>

  <!-- L’interpolazione mostra i valori della classe TypeScript. -->
  <h2 class="title">{{ message }}</h2>

  <p class="summary">
    Hai premuto il pulsante <strong>{{ count }}</strong> volte.
  </p>

  <!-- I clic cambiano lo stato; Angular aggiorna la vista. -->
  <div class="actions">
    <button class="control" (click)="count = count + 1">
      Aggiungi 1
    </button>

    <button
      class="control"
      (click)="highlighted = !highlighted"
      [attr.aria-pressed]="highlighted"
    >
      Evidenzia scheda
    </button>
  </div>
</section>`,
  css: `/* Aspetto di base: prova a cambiare lo sfondo o il bordo. */
.card {
  padding: 1.5rem;
  border: 0.125rem solid #d8d3ed;
  border-radius: 1rem;
  background: #faf8ff;
}

/* Angular aggiunge questa classe quando highlighted è true. */
.card--highlighted {
  background: #eee7ff;
  border-color: #6746c3;
}

/* La tipografia crea una gerarchia visiva chiara. */
.eyebrow {
  color: #6746c3;
  font-size: 0.75rem;
  font-weight: 700;
}

.title {
  margin: 0.5rem 0;
  font-size: 1.75rem;
}

.summary {
  margin: 0 0 1rem;
}

/* I controlli restano utilizzabili anche con una preview stretta. */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.control {
  padding: 0.5rem 0.75rem;
  border: 0.0625rem solid #6746c3;
  border-radius: 0.5rem;
  color: #4c318e;
  background: white;
}`,
};
