import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { Icon } from '../components/icon/icon';

interface BouncingLogoData {
  id: number;
  top: number;
  left: number;
  size: number;
  velocityX: number;
  velocityY: number;
  animationFrameId?: number;
  isShiny?: boolean; // Se true, il logo ha il gradiente animato speciale
  contentType: 'logo' | 'topic'; // Tipo di contenuto da mostrare
  topicIcon?: string; // Nome icona se contentType è 'topic'
  topicTitle?: string; // Titolo topic se contentType è 'topic'
}

@Component({
  selector: 'app-bouncing-logo',
  standalone: true,
  imports: [Icon],
  templateUrl: './bouncing-logo.html',
  styleUrl: './bouncing-logo.scss',
})
export class BouncingLogo implements OnInit, OnDestroy {
  // ═══════════════════════════════════════════════════════════════════
  // CONFIGURAZIONE
  // ═══════════════════════════════════════════════════════════════════
  private readonly BASE_VELOCITY = 2; // Velocità base (px per frame)
  private readonly BASE_LOGO_SIZE = 120; // Dimensione base del logo (px)
  private readonly LOGO_DURATION = 10000; // Durata di ogni logo (ms)
  private readonly AUTO_SPAWN_INTERVAL = 12000; // Intervallo spawn automatico (ms)

  // Probabilità di spawn con moltiplicatori speciali (valori da 0 a 1)
  private readonly VELOCITY_MULTIPLIERS = [
    { multiplier: 1, probability: 0.5 }, // 50% - velocità normale (0.8-1.2x)
    { multiplier: 2, probability: 0.3 }, // 30% - velocità doppia
    { multiplier: 4, probability: 0.05 }, // 5%  - velocità quadrupla
  ];

  private readonly SIZE_MULTIPLIERS = [
    { multiplier: 1, probability: 0.6 }, // 60% - dimensione normale (0.8-1.2x)
    { multiplier: 3, probability: 0.1 }, // 10%  - dimensione tripla
  ];

  private readonly SHINY_PROBABILITY = 0.05; // 5% - probabilità logo "shiny" con gradiente animato
  private readonly DEFAULT_SPAWN_ENABLED = false; // Se lo spawn automatico è attivo di default

  // Topics da mostrare casualmente nei loghi (solo se non shiny)
  private readonly TOPICS = [
    { icon: 'data-binding', title: 'Data Binding' },
    { icon: 'directives', title: 'Directives' },
    { icon: 'form', title: 'Forms' },
    { icon: 'users', title: 'Users' },
    { icon: 'signals', title: 'Signals' },
  ];

  // ═══════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════
  bouncingLogos = signal<BouncingLogoData[]>([]);
  isSpawnEnabled = signal(this.DEFAULT_SPAWN_ENABLED); // Controlla se lo spawn automatico è attivo
  private intervalId?: number;
  private nextLogoId = 0;

  ngOnInit() {
    // Avvia lo spawn automatico solo se abilitato di default
    if (this.DEFAULT_SPAWN_ENABLED) {
      this.createLogo(); // Mostra il primo logo immediatamente
      this.startAutoSpawn();
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    // Cancella tutte le animazioni attive
    this.bouncingLogos().forEach((logo) => {
      if (logo.animationFrameId) {
        cancelAnimationFrame(logo.animationFrameId);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // METODI PUBBLICI
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Gestisce il click su un logo per crearne uno nuovo dalla sua posizione
   */
  onLogoClick(logo: BouncingLogoData, event: MouseEvent) {
    event.stopPropagation();
    // Crea un nuovo logo partendo dalla posizione del logo cliccato (centrato)
    const centerX = logo.left + logo.size / 2;
    const centerY = logo.top + logo.size / 2;
    this.createLogo(centerX, centerY);
  }

  /**
   * Toggle per attivare/disattivare lo spawn automatico dei loghi
   */
  toggleSpawn() {
    this.isSpawnEnabled.update((enabled) => !enabled);

    if (this.isSpawnEnabled()) {
      this.startAutoSpawn();
    } else {
      this.stopAutoSpawn();
    }
  }

  /**
   * Spawna manualmente un nuovo logo in posizione casuale
   */
  spawnLogo() {
    this.createLogo();
  }

  /**
   * Avvia lo spawn automatico dei loghi
   */
  private startAutoSpawn() {
    if (this.intervalId) return; // Previene interval duplicati

    this.intervalId = window.setInterval(() => {
      this.createLogo();
    }, this.AUTO_SPAWN_INTERVAL);
  }

  /**
   * Ferma lo spawn automatico dei loghi
   */
  private stopAutoSpawn() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // METODI PRIVATI
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Crea un nuovo logo con posizione casuale o da coordinate specificate
   */
  private createLogo(sourceX?: number, sourceY?: number) {
    // Determina il moltiplicatore per la dimensione in base alle probabilità
    const sizeMultiplier = this.getRandomMultiplier(this.SIZE_MULTIPLIERS);
    // Dimensione con variazione casuale (0.8-1.2x) e moltiplicatore speciale
    let size = this.BASE_LOGO_SIZE * sizeMultiplier * (0.8 + Math.random() * 0.4);

    // Limita la dimensione massima all'80% della larghezza della finestra
    const maxSize = window.innerWidth * 0.8;
    if (size > maxSize) {
      size = maxSize;
    }

    // Se viene cliccato un logo, parte dalla sua posizione, altrimenti posizione casuale
    const startTop = sourceY !== undefined ? sourceY : Math.random() * (window.innerHeight - size);
    const startLeft = sourceX !== undefined ? sourceX : Math.random() * (window.innerWidth - size);

    // Determina il moltiplicatore per la velocità in base alle probabilità
    const velocityBaseMultiplier = this.getRandomMultiplier(this.VELOCITY_MULTIPLIERS);
    // Velocità con variazione casuale (0.8-1.2x) e moltiplicatore speciale
    const velocityMultiplier = velocityBaseMultiplier * (0.8 + Math.random() * 0.4);
    const velocityX = (Math.random() > 0.5 ? 1 : -1) * this.BASE_VELOCITY * velocityMultiplier;
    const velocityY = (Math.random() > 0.5 ? 1 : -1) * this.BASE_VELOCITY * velocityMultiplier;

    // Determina se il logo è "shiny" (raro 5%!)
    const isShiny = Math.random() < this.SHINY_PROBABILITY;

    // Se è shiny, mostra il logo Angular shiny, altrimenti mostra sempre un topic
    let contentType: 'logo' | 'topic' = 'topic';
    let topicIcon: string | undefined;
    let topicTitle: string | undefined;

    if (isShiny) {
      // 5% - Logo Angular shiny
      contentType = 'logo';
    } else {
      // 95% - Mostra un topic casuale
      const randomTopic = this.TOPICS[Math.floor(Math.random() * this.TOPICS.length)];
      topicIcon = randomTopic.icon;
      topicTitle = randomTopic.title;
    }

    const logo: BouncingLogoData = {
      id: this.nextLogoId++,
      top: startTop,
      left: startLeft,
      size,
      velocityX,
      velocityY,
      isShiny,
      contentType,
      topicIcon,
      topicTitle,
    };

    // Aggiungi il logo all'array
    this.bouncingLogos.update((logos) => [...logos, logo]);

    // Avvia l'animazione per questo logo
    this.animateLogo(logo);

    // Rimuovi il logo dopo X secondi
    setTimeout(() => {
      this.removeLogo(logo.id);
    }, this.LOGO_DURATION);
  }

  /**
   * Rimuove un logo dall'array e cancella la sua animazione
   */
  private removeLogo(id: number) {
    this.bouncingLogos.update((logos) => {
      const logo = logos.find((l) => l.id === id);
      if (logo?.animationFrameId) {
        cancelAnimationFrame(logo.animationFrameId);
      }
      return logos.filter((l) => l.id !== id);
    });
  }

  /**
   * Seleziona un moltiplicatore casuale in base alle probabilità configurate
   */
  private getRandomMultiplier(
    multipliers: Array<{ multiplier: number; probability: number }>
  ): number {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const { multiplier, probability } of multipliers) {
      cumulativeProbability += probability;
      if (random <= cumulativeProbability) {
        return multiplier;
      }
    }

    // Fallback al primo moltiplicatore se qualcosa va storto
    return multipliers[0].multiplier;
  }

  /**
   * Anima un singolo logo con movimento e rimbalzo sui bordi
   */
  private animateLogo(logo: BouncingLogoData) {
    const animate = () => {
      // Verifica se il logo esiste ancora
      const currentLogos = this.bouncingLogos();
      const currentLogo = currentLogos.find((l) => l.id === logo.id);
      if (!currentLogo) return;

      let newTop = currentLogo.top + currentLogo.velocityY;
      let newLeft = currentLogo.left + currentLogo.velocityX;

      // Rimbalzo sui bordi verticali
      if (newTop <= 0 || newTop >= window.innerHeight - currentLogo.size) {
        currentLogo.velocityY *= -1;
        newTop = newTop <= 0 ? 0 : window.innerHeight - currentLogo.size;
      }

      // Rimbalzo sui bordi orizzontali
      if (newLeft <= 0 || newLeft >= window.innerWidth - currentLogo.size) {
        currentLogo.velocityX *= -1;
        newLeft = newLeft <= 0 ? 0 : window.innerWidth - currentLogo.size;
      }

      // Aggiorna la posizione del logo
      this.bouncingLogos.update((logos) =>
        logos.map((l) => (l.id === logo.id ? { ...l, top: newTop, left: newLeft } : l))
      );

      // Continua l'animazione
      currentLogo.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }
}
