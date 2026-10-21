import type { LessonExample } from '../components/lesson-examples/lesson-examples';
import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { FALLBACK_DIAGRAM, NAVIGATION_DIAGRAM, PARAMETERS_DIAGRAM } from './routing-diagrams';

// The same application shell pattern is intentionally repeated: each example is
// an independent project, with its own config, routes and child files.
const NAVIGATION_ROOT = `import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

// RADICE: vive per tutta la durata dell'applicazione, fuori dalle rotte figlie.
@Component({
  selector: 'app-routing-navigation',
  imports: [MatButtonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class RoutingNavigation {
  // inject recupera il router configurato da provideRouter in app.config.ts.
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  // Il promemoria appartiene alla radice: cambiare figlio non lo azzera.
  readonly reminders = signal(0);

  // router.url è una lettura sincrona; il signal la espone al template.
  readonly url = signal(this.router.url);

  constructor() {
    // Dopo ogni navigazione completata, aggiorniamo l’URL mostrato nel template.
    const events = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.url.set(this.router.url);
    });

    // La sottoscrizione termina insieme al componente.
    this.destroyRef.onDestroy(() => events.unsubscribe());
  }

  increment(): void {
    this.reminders.update(value => value + 1);
  }

  // Location usa la cronologia interna del playground; nel progetto locale usa quella del browser.
  back(): void {
    this.location.back();
  }

  forward(): void {
    this.location.forward();
  }
}`;

const NAVIGATION_HTML = `<section class="demo">
  <p class="hint">
    La radice resta montata: il router cambia solo la vista dentro <code>router-outlet</code>.
  </p>

  <!-- routerLink chiede la navigazione interna: il browser non ricarica la pagina. -->
  <nav class="links" aria-label="Navigazione dell'esempio">
    <!-- routerLinkActive aggiunge .active; exact evita che /overview resti attivo su un percorso figlio.
         ariaCurrentWhenActive segnala la pagina corrente anche alle tecnologie assistive. -->
    <a
      matButton="outlined"
      routerLink="/overview"
      routerLinkActive="active"
      [routerLinkActiveOptions]="{ exact: true }"
      ariaCurrentWhenActive="page"
      data-testid="nav-overview"
    >Panoramica</a>

    <a
      matButton="outlined"
      routerLink="/about"
      routerLinkActive="active"
      [routerLinkActiveOptions]="{ exact: true }"
      ariaCurrentWhenActive="page"
      data-testid="nav-about"
    >Chi siamo</a>
  </nav>

  <div class="state">
    <p role="status" data-testid="root-state">Promemoria della radice: {{ reminders() }}</p>

    <button
      matButton="tonal"
      type="button"
      data-testid="root-increment"
      (click)="increment()"
    >Aumenta il promemoria</button>
  </div>

  <!-- L'outlet è il punto in cui il router monta la vista figlia; la radice resta fuori. -->
  <div class="outlet">
    <router-outlet />
  </div>

  <!-- Indietro e Avanti percorrono solo la cronologia interna di questa anteprima. -->
  <div class="history">
    <button matButton="text" type="button" data-testid="history-back" (click)="back()">Indietro</button>
    <button matButton="text" type="button" data-testid="history-forward" (click)="forward()">Avanti</button>
  </div>

  <!-- router.url è l'URL interno della SPA: mostrarlo rende visibile il cambio di rotta. -->
  <p class="url" data-testid="router-url">URL interno simulato: <code>{{ url() }}</code></p>
</section>`;

const NAVIGATION_CSS = `.demo {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.hint,
.url {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
  line-height: 1.6;
}

.links,
.state,
.history {
  /* flex-wrap lascia andare a capo i controlli su schermi stretti. */
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

/* Il riquadro separa visivamente la vista del router; non decide quale vista mostrare. */
.outlet {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.active {
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.25rem;
}

.url code {
  /* Colore del tema per l'URL: è enfasi visiva, non una regola di navigazione. */
  color: var(--mat-sys-primary);
}`;

const NAVIGATION_OVERVIEW = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

// VISTA FIGLIA: il router la crea quando il percorso attivo è /overview.
@Component({
  selector: 'app-overview-view',
  imports: [MatButtonModule, RouterLink],
  template: \`
    <article class="view">
      <h2>Panoramica</h2>
      <p data-testid="overview-copy">
        Questa vista è stata creata dal router per il percorso <code>/overview</code>.
      </p>

      <!-- Anche una vista figlia naviga con routerLink, senza ricaricare la pagina. -->
      <a matButton="filled" routerLink="/about" data-testid="overview-to-about">Apri Chi siamo</a>
    </article>
  \`,
  styles: [\`
    .view {
      display: grid;
      gap: 0.75rem;
    }

    .view h2,
    .view p {
      margin: 0;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class OverviewView {}`;

const NAVIGATION_ABOUT = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

// La stessa radice ospita questa seconda vista, senza essere ricreata.
@Component({
  selector: 'app-about-view',
  imports: [MatButtonModule, RouterLink],
  template: \`
    <article class="view">
      <h2>Chi siamo</h2>
      <p data-testid="about-copy">
        Il promemoria della radice è ancora lì: navigare non ha ricreato il componente padre.
      </p>

      <a matButton="outlined" routerLink="/overview" data-testid="about-to-overview">
        Torna alla panoramica
      </a>
    </article>
  \`,
  styles: [\`
    .view {
      display: grid;
      gap: 0.75rem;
    }

    .view h2,
    .view p {
      margin: 0;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class AboutView {}`;

const NAVIGATION_ROUTES = `import { Routes } from '@angular/router';
import { AboutView } from './about-view.component';
import { OverviewView } from './overview-view.component';

// Ogni percorso sceglie il componente da montare nell'outlet della radice.
export const routes: Routes = [
  // Il percorso vuoto reindirizza solo quando l'URL è esattamente '/'.
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  { path: 'overview', component: OverviewView },
  { path: 'about', component: AboutView },
];`;

const NAVIGATION_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// La configurazione importa le rotte e le registra nel router.
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};`;

const PARAMETERS_ROOT = `import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';

// RADICE: contiene i link e l'outlet, mentre il dettaglio riceve l'ID dall'URL.
@Component({
  selector: 'app-routing-parameters',
  imports: [MatButtonModule, RouterLink, RouterOutlet],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class RoutingParameters {
  // inject recupera il router configurato da provideRouter in app.config.ts.
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly url = signal(this.router.url);

  constructor() {
    // NavigationEnd arriva a navigazione completata: qui l'URL è quello definitivo.
    const events = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.url.set(this.router.url);
    });

    // DestroyRef chiude la sottoscrizione quando la radice viene distrutta.
    this.destroyRef.onDestroy(() => events.unsubscribe());
  }
}`;

const PARAMETERS_HTML = `<section class="demo">
  <p class="hint">
    Il percorso <code>detail/:id</code> riusa lo stesso componente quando cambia solo l'ID.
  </p>

  <!-- Ogni link cambia solo il segmento :id dell'URL. -->
  <nav class="links" aria-label="Dettagli dell'esempio">
    <a matButton="outlined" routerLink="/detail/1" data-testid="param-link-1">Dettaglio 1</a>
    <a matButton="outlined" routerLink="/detail/2" data-testid="param-link-2">Dettaglio 2</a>
    <a matButton="outlined" routerLink="/detail/999" data-testid="param-link-999">ID 999</a>
  </nav>

  <!-- L'outlet resta nella radice: cambia solo il dettaglio montato al suo interno. -->
  <div class="outlet">
    <router-outlet />
  </div>

  <!-- L'URL interno rende visibile il parametro che arriva al componente. -->
  <p class="url" data-testid="router-url">URL interno simulato: <code>{{ url() }}</code></p>
</section>`;

const PARAMETERS_CSS = `.demo {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.hint,
.url {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
  line-height: 1.6;
}

.links {
  /* flex-wrap lascia andare a capo i link su schermi stretti. */
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Lo stile del riquadro è solo presentazione: il contenuto lo sceglie il router. */
.outlet {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.url code {
  /* Colore del tema per l'URL: è enfasi visiva, non una regola di navigazione. */
  color: var(--mat-sys-primary);
}`;

const PARAMETERS_DETAIL = `import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

// Dati locali delle schede: esistono solo per gli ID 1 e 2.
const CARDS: Record<string, string> = {
  '1': 'Componenti: una classe e il suo template.',
  '2': 'Servizi: dipendenze condivise.',
};

// DETTAGLIO: withComponentInputBinding collega :id all'input id.
@Component({
  selector: 'app-detail-view',
  imports: [MatButtonModule, RouterLink],
  template: \`
    <article class="detail">
      <h2 data-testid="detail-id">Scheda {{ id() }}</h2>
      <p data-testid="detail-content">{{ content() }}</p>
      <p data-testid="detail-local">Click in questa istanza: {{ localClicks }}</p>

      <div class="actions">
        <button
          matButton="tonal"
          type="button"
          data-testid="detail-local-button"
          (click)="increment()"
        >Segna un click</button>

        <a matButton="outlined" routerLink="/detail/1">Vai all'ID 1</a>
        <a matButton="outlined" routerLink="/detail/2">Vai all'ID 2</a>
      </div>

      <p class="hint">
        1 → 2 aggiorna <code>input()</code> nella stessa istanza: il conteggio locale resta.
      </p>
    </article>
  \`,
  styles: [\`
    .detail {
      display: grid;
      gap: 0.75rem;
    }

    .detail h2,
    .detail p {
      margin: 0;
    }

    .actions {
      /* flex-wrap evita che i pulsanti escano dal riquadro su schermi stretti. */
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .hint {
      color: var(--mat-sys-on-surface-variant);
      line-height: 1.6;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DetailView {
  // Il nome id coincide con :id nella rotta: il router aggiorna questo input a ogni cambio di ID.
  readonly id = input.required<string>();

  // Campo semplice: dimostra che Angular riusa questa istanza per ID 1 e 2.
  localClicks = 0;

  // computed ricalcola il testo quando id() cambia, anche nella stessa istanza.
  // ID 999 corrisponde alla rotta, ma manca nei dati: non è un errore di percorso.
  readonly content = computed(() => CARDS[this.id()] ??
    'Nessuna scheda per questo ID: scegli il dettaglio 1 o 2.');

  increment(): void {
    this.localClicks += 1;
  }
}`;

const PARAMETERS_ROUTES = `import { Routes } from '@angular/router';
import { DetailView } from './detail-view.component';

// :id è un segmento variabile: /detail/2 corrisponde alla stessa rotta di /detail/1.
export const routes: Routes = [
  // Solo l'URL vuoto viene reindirizzato al primo dettaglio.
  { path: '', pathMatch: 'full', redirectTo: 'detail/1' },
  { path: 'detail/:id', component: DetailView },
];`;

const PARAMETERS_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

// withComponentInputBinding collega :id all'input id del dettaglio.
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes, withComponentInputBinding())],
};`;

const FALLBACK_ROOT = `import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';

// RADICE: i link restano disponibili anche quando la vista è quella di fallback.
@Component({
  selector: 'app-routing-fallback',
  imports: [MatButtonModule, RouterLink, RouterOutlet],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class RoutingFallback {
  // inject recupera il router configurato da provideRouter in app.config.ts.
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly url = signal(this.router.url);

  constructor() {
    // NavigationEnd arriva a navigazione completata: qui l'URL è quello definitivo.
    const events = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.url.set(this.router.url);
    });

    // DestroyRef chiude la sottoscrizione quando la radice viene distrutta.
    this.destroyRef.onDestroy(() => events.unsubscribe());
  }
}`;

const FALLBACK_HTML = `<section class="demo">
  <p class="hint">
    La rotta <code>**</code> è l'ultima: intercetta solo i percorsi non riconosciuti sopra.
  </p>

  <!-- I link possono portare a percorsi esistenti o sconosciuti: decide il router. -->
  <nav class="links" aria-label="Percorsi dell'esempio">
    <a matButton="outlined" routerLink="/home" data-testid="fallback-home">Home</a>
    <a matButton="outlined" routerLink="/missing-page" data-testid="fallback-missing">Percorso sconosciuto</a>
    <a matButton="outlined" routerLink="/sezioni/inesistente" data-testid="fallback-deep">Percorso profondo</a>
  </nav>

  <div class="outlet">
    <router-outlet />
  </div>

  <p class="url" data-testid="router-url">URL interno simulato: <code>{{ url() }}</code></p>
</section>`;

const FALLBACK_CSS = `.demo {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.hint,
.url {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
  line-height: 1.6;
}

.links {
  /* flex-wrap lascia andare a capo i link su schermi stretti. */
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Lo stile del riquadro è solo presentazione: il contenuto lo sceglie il router. */
.outlet {
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.url code {
  /* Colore del tema per l'URL: è enfasi visiva, non una regola di navigazione. */
  color: var(--mat-sys-primary);
}`;

const FALLBACK_HOME = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

// Una rotta dichiarata prima del jolly vince sul fallback.
@Component({
  selector: 'app-home-view',
  imports: [MatButtonModule, RouterLink],
  template: \`
    <article class="view">
      <h2>Home</h2>
      <p data-testid="home-copy">Il percorso <code>/home</code> è riconosciuto prima del jolly.</p>

      <a matButton="filled" routerLink="/missing-page" data-testid="home-to-missing">
        Prova un percorso sconosciuto
      </a>
    </article>
  \`,
  styles: [\`
    .view {
      display: grid;
      gap: 0.75rem;
    }

    .view h2,
    .view p {
      margin: 0;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class HomeView {}`;

const FALLBACK_NOT_FOUND = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

// Il jolly monta questa vista per qualunque percorso non riconosciuto.
@Component({
  selector: 'app-not-found-view',
  imports: [MatButtonModule, RouterLink],
  template: \`
    <article class="view" data-testid="not-found">
      <h2>Percorso non riconosciuto</h2>
      <p>
        Nessuna rotta precedente corrisponde a questo URL. Il jolly <code>**</code> monta questa vista.
      </p>

      <a matButton="tonal" routerLink="/home" data-testid="not-found-recover">Torna alla Home</a>
    </article>
  \`,
  styles: [\`
    .view {
      display: grid;
      gap: 0.75rem;
    }

    .view h2,
    .view p {
      margin: 0;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NotFoundView {}`;

const FALLBACK_ROUTES = `import { Routes } from '@angular/router';
import { HomeView } from './home-view.component';
import { NotFoundView } from './not-found-view.component';

// L'ordine conta: il jolly deve restare per ultimo.
export const routes: Routes = [
  // pathMatch: 'full' limita il redirect all'URL radice.
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeView },
  // Il jolly resta ultimo e intercetta ogni percorso non riconosciuto sopra.
  { path: '**', component: NotFoundView },
];`;

const FALLBACK_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// provideRouter collega la configurazione alle rotte dichiarate.
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)],
};`;

const NAVIGATION_SOURCES: PlaygroundSources = {
  typescript: NAVIGATION_ROOT,
  html: NAVIGATION_HTML,
  css: NAVIGATION_CSS,
  files: {
    'app.config.ts': NAVIGATION_CONFIG,
    'app.routes.ts': NAVIGATION_ROUTES,
    'overview-view.component.ts': NAVIGATION_OVERVIEW,
    'about-view.component.ts': NAVIGATION_ABOUT,
  },
};

const PARAMETERS_SOURCES: PlaygroundSources = {
  typescript: PARAMETERS_ROOT,
  html: PARAMETERS_HTML,
  css: PARAMETERS_CSS,
  files: {
    'app.config.ts': PARAMETERS_CONFIG,
    'app.routes.ts': PARAMETERS_ROUTES,
    'detail-view.component.ts': PARAMETERS_DETAIL,
  },
};

const FALLBACK_SOURCES: PlaygroundSources = {
  typescript: FALLBACK_ROOT,
  html: FALLBACK_HTML,
  css: FALLBACK_CSS,
  files: {
    'app.config.ts': FALLBACK_CONFIG,
    'app.routes.ts': FALLBACK_ROUTES,
    'home-view.component.ts': FALLBACK_HOME,
    'not-found-view.component.ts': FALLBACK_NOT_FOUND,
  },
};

export const ROUTING_EXAMPLES: readonly LessonExample[] = [
  {
    id: 'navigation',
    label: '1. Navigazione',
    title: 'La radice resta, il figlio cambia',
    prompt:
      'Aumenta il **promemoria**, poi apri **Panoramica** e **Chi siamo**: il valore resta. Usa **Indietro** e **Avanti** per percorrere la cronologia interna. Osserva `router.url` in fondo alla preview.',
    takeaway:
      '`RouterLink` chiede una navigazione e `RouterOutlet` mostra la vista attiva. Le rotte sono dichiarate in `app.routes.ts` e registrate da `provideRouter` in `app.config.ts`; la radice non viene ricreata a ogni cambio di figlio.',
    sources: NAVIGATION_SOURCES,
    diagram: NAVIGATION_DIAGRAM,
  },
  {
    id: 'parameters',
    label: '2. Parametri',
    title: 'Un ID nell’URL, una sola istanza',
    prompt:
      'Apri il **Dettaglio 1**, premi **Segna un click**, poi passa al **Dettaglio 2**: l’ID cambia e il conteggio resta. Prova **ID 999**: la rotta esiste, ma i dati no. Usa i link nella scheda per tornare a 1 o 2.',
    takeaway:
      'La rotta `detail/:id` e `withComponentInputBinding()` portano il parametro nell’`input` `id`. Angular riusa lo stesso componente quando cambia solo il parametro: un ID valido non garantisce che esistano i dati corrispondenti.',
    sources: PARAMETERS_SOURCES,
    diagram: PARAMETERS_DIAGRAM,
  },
  {
    id: 'fallback',
    label: '3. Fallback',
    title: 'Il jolly ** resta per ultimo',
    prompt:
      'Apri **Percorso sconosciuto** e poi **Percorso profondo**: entrambi finiscono nella vista di fallback. Premi **Torna alla Home** e verifica che `/home` venga di nuovo riconosciuto.',
    takeaway:
      'Le rotte sono confrontate in ordine: `**` deve essere l’ultima, altrimenti intercetterebbe anche i percorsi dichiarati dopo. Una vista di fallback utile offre sempre un link di recupero.',
    sources: FALLBACK_SOURCES,
    diagram: FALLBACK_DIAGRAM,
  },
];
