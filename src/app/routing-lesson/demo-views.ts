// COMPONENT TYPE: Presentational Route Views
// SECTION: Angular Basics
// ROLE: Render nested sandbox views and react to parameters without leaving the lesson.
// PATTERNS USED: ActivatedRoute observables converted to signals with lifecycle-safe subscriptions.
// NOTES FOR CONTRIBUTORS: Keep links relative to this sandbox; never capture only a param snapshot.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-routing-demo-overview',
  imports: [RouterLink, MatButtonModule],
  template: `<h3 class="lesson-subtitle">Panoramica della demo</h3>
    <p class="lesson-text" role="status">Questa è una vista figlia: viene montata dentro il router-outlet della lezione. Apri un dettaglio e osserva l'URL.</p>
    <a matButton="tonal" [routerLink]="['detail', 1]" [relativeTo]="parentRoute" queryParamsHandling="preserve">Apri il dettaglio 1</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoOverview {
  readonly parentRoute = inject(ActivatedRoute).parent;
}

@Component({
  selector: 'app-routing-demo-detail',
  imports: [RouterLink, MatButtonModule],
  template: `<h3 class="lesson-subtitle">Dettaglio: parametro dalla rotta</h3>
    <p class="lesson-output" data-testid="detail-id">ID letto da paramMap: {{ id() }}</p>
    <p class="lesson-result" role="status" data-testid="detail-content">{{ title() }}</p>
    <p class="lesson-text" data-testid="detail-mode">Query mode: {{ mode() }}. Un parametro di query modifica la presentazione senza cambiare l'identità del dettaglio.</p>
    <div class="lesson-actions">
      <a matButton="outlined" [routerLink]="['detail', nextId()]" [relativeTo]="parentRoute" queryParamsHandling="preserve">Passa al dettaglio {{ nextId() }}</a>
      <a matButton="text" [routerLink]="['detail', 999]" [relativeTo]="parentRoute" queryParamsHandling="preserve">Prova ID assente</a>
    </div>
    <p class="lesson-text">Il passaggio da ID 1 a ID 2 riusa questo componente: paramMap notifica il nuovo valore. L'ID 999 corrisponde alla rotta, ma non ai dati locali.</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoDetail {
  private readonly route = inject(ActivatedRoute);
  readonly parentRoute = this.route.parent;
  private readonly params = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });
  private readonly query = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly id = computed(() => this.params().get('id') ?? '');
  readonly mode = computed(() => this.query().get('mode') === 'compact' ? 'compatta' : 'completa');
  readonly nextId = computed(() => this.id() === '1' ? 2 : 1);
  readonly title = computed(() => {
    if (this.id() === '1') return 'Scheda 1 — Componenti: classe e template.';
    if (this.id() === '2') return 'Scheda 2 — Servizi: dipendenze condivise.';
    return 'Nessuna scheda per questo ID. Scegli il dettaglio 1 o 2.';
  });
}

@Component({
  selector: 'app-routing-demo-not-found',
  imports: [RouterLink, MatButtonModule],
  template: `<h3 class="lesson-subtitle">Percorso della demo non trovato</h3>
    <p class="lesson-result" role="status">La rotta jolly ** ha intercettato questo percorso. La lezione e i suoi controlli restano visibili.</p>
    <a matButton="tonal" [routerLink]="['overview']" [relativeTo]="parentRoute">Torna alla panoramica</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoNotFound {
  readonly parentRoute = inject(ActivatedRoute).parent;
}
