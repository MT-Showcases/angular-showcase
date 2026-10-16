// COMPONENT TYPE: Presentational
// SECTION: Home Page - Interactive Animation
//
// ROLE:
// - Create interactive bouncing Angular logos with physics-based animation
// - Handle click-to-spawn functionality for user engagement
// - Auto-spawn logos with varied velocity multipliers
// - Display topic cards on click with smooth animations
//
// PATTERNS USED:
// - requestAnimationFrame for smooth 60fps animations
// - Signal-based state management for logo array
// - Probabilistic spawning with weighted velocity multipliers
// - Custom physics simulation (collision detection, velocity, bounce)
//
// NOTES FOR CONTRIBUTORS:
// - Animation runs on requestAnimationFrame, not CSS transitions
// - Each logo has independent velocity and lifecycle
// - Collision detection uses bounding box calculations
// - Memory cleanup is critical: always cancel animation frames in ngOnDestroy
// - Velocity multipliers create varied speeds (1x, 2x, 4x, 8x, infinite)

import { Component, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Icon } from '../components/icon/icon';

// PATTERN: Bouncing logo data structure
// PURPOSE:
// - Encapsulates all state needed for a single bouncing logo
// - Supports both logo and topic card content types
// - Tracks animation frame for cleanup
interface BouncingLogoData {
  id: number;
  top: number;
  left: number;
  size: number;
  velocityX: number;
  velocityY: number;
  animationFrameId?: number;
  isShiny?: boolean; // If true, logo has special animated gradient
  contentType: 'logo' | 'topic'; // Type of content to display
  topicIcon?: string; // Icon name if contentType is 'topic'
  topicTitle?: string; // Topic title if contentType is 'topic'
}

@Component({
  selector: 'app-bouncing-logo',
  standalone: true,
  imports: [Icon],
  templateUrl: './bouncing-logo.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './bouncing-logo.scss',
})
export class BouncingLogo implements OnInit, OnDestroy {
  // ═══════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════
  private readonly BASE_VELOCITY = 2; // Base velocity (px per frame)
  private readonly BASE_LOGO_SIZE = 120; // Base logo size (px)
  private readonly LOGO_DURATION = 10000; // Duration of each logo (ms)
  private readonly AUTO_SPAWN_INTERVAL = 12000; // Auto spawn interval (ms)

  // Spawn probability with special multipliers (values from 0 to 1)
  private readonly VELOCITY_MULTIPLIERS = [
    { multiplier: 1, probability: 0.5 }, // 50% - normal velocity (0.8-1.2x)
    { multiplier: 2, probability: 0.3 }, // 30% - double velocity
    { multiplier: 4, probability: 0.05 }, // 5% - quadruple velocity
  ];

  private readonly SIZE_MULTIPLIERS = [
    { multiplier: 1, probability: 0.6 }, // 60% - normal size (0.8-1.2x)
    { multiplier: 3, probability: 0.1 }, // 10% - triple size
  ];

  private readonly SHINY_PROBABILITY = 0.05; // 5% - probability of "shiny" logo with animated gradient
  private readonly DEFAULT_SPAWN_ENABLED = false; // Whether auto spawn is enabled by default

  // Topics to randomly display in logos (only if not shiny)
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
  isSpawnEnabled = signal(this.DEFAULT_SPAWN_ENABLED); // Controls whether auto spawn is active
  private intervalId?: number;
  private nextLogoId = 0;

  ngOnInit() {
    // Start automatic spawn only if enabled by default
    if (this.DEFAULT_SPAWN_ENABLED) {
      this.createLogo(); // Show first logo immediately
      this.startAutoSpawn();
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    // Cancel all active animations
    this.bouncingLogos().forEach((logo) => {
      if (logo.animationFrameId) {
        cancelAnimationFrame(logo.animationFrameId);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC METHODS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Handle click on a logo to create a new one from its position
   */
  onLogoClick(logo: BouncingLogoData, event: MouseEvent) {
    event.stopPropagation();
    // Create new logo starting from clicked logo position (centered)
    const centerX = logo.left + logo.size / 2;
    const centerY = logo.top + logo.size / 2;
    this.createLogo(centerX, centerY);
  }

  /**
   * Toggle to enable/disable automatic logo spawning
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
   * Manually spawn a new logo at a random position
   */
  spawnLogo() {
    this.createLogo();
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Start automatic logo spawning
   */
  private startAutoSpawn() {
    if (this.intervalId) return; // Prevent duplicate intervals

    this.intervalId = window.setInterval(() => {
      this.createLogo();
    }, this.AUTO_SPAWN_INTERVAL);
  }

  /**
   * Stop automatic logo spawning
   */
  private stopAutoSpawn() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /**
   * Create a new logo with random position or from specified coordinates
   */
  private createLogo(sourceX?: number, sourceY?: number) {
    // Determine size multiplier based on probabilities
    const sizeMultiplier = this.getRandomMultiplier(this.SIZE_MULTIPLIERS);
    // Size with random variation (0.8-1.2x) and special multiplier
    let size = this.BASE_LOGO_SIZE * sizeMultiplier * (0.8 + Math.random() * 0.4);

    // Limit maximum size to 80% of window width
    const maxSize = window.innerWidth * 0.8;
    if (size > maxSize) {
      size = maxSize;
    }

    // If logo is clicked, start from its position, otherwise random position
    const startTop = sourceY !== undefined ? sourceY : Math.random() * (window.innerHeight - size);
    const startLeft = sourceX !== undefined ? sourceX : Math.random() * (window.innerWidth - size);

    // Determine velocity multiplier based on probabilities
    const velocityBaseMultiplier = this.getRandomMultiplier(this.VELOCITY_MULTIPLIERS);
    // Velocity with random variation (0.8-1.2x) and special multiplier
    const velocityMultiplier = velocityBaseMultiplier * (0.8 + Math.random() * 0.4);
    const velocityX = (Math.random() > 0.5 ? 1 : -1) * this.BASE_VELOCITY * velocityMultiplier;
    const velocityY = (Math.random() > 0.5 ? 1 : -1) * this.BASE_VELOCITY * velocityMultiplier;

    // Determine if logo is "shiny" (rare 5%!)
    const isShiny = Math.random() < this.SHINY_PROBABILITY;

    // If shiny, show shiny Angular logo, otherwise always show a topic
    let contentType: 'logo' | 'topic' = 'topic';
    let topicIcon: string | undefined;
    let topicTitle: string | undefined;

    if (isShiny) {
      // 5% - Shiny Angular logo
      contentType = 'logo';
    } else {
      // 95% - Show a random topic
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

    // Add logo to array
    this.bouncingLogos.update((logos) => [...logos, logo]);

    // Start animation for this logo
    this.animateLogo(logo);

    // Remove logo after X seconds
    setTimeout(() => {
      this.removeLogo(logo.id);
    }, this.LOGO_DURATION);
  }

  /**
   * Remove a logo from the array and cancel its animation
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
   * Select a random multiplier based on configured probabilities
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

    // Fallback to first multiplier if something goes wrong
    return multipliers[0].multiplier;
  }

  /**
   * Animate a single logo with movement and edge bouncing
   */
  private animateLogo(logo: BouncingLogoData) {
    const animate = () => {
      // Check if logo still exists
      const currentLogos = this.bouncingLogos();
      const currentLogo = currentLogos.find((l) => l.id === logo.id);
      if (!currentLogo) return;

      let newTop = currentLogo.top + currentLogo.velocityY;
      let newLeft = currentLogo.left + currentLogo.velocityX;

      // Bounce on vertical edges
      if (newTop <= 0 || newTop >= window.innerHeight - currentLogo.size) {
        currentLogo.velocityY *= -1;
        newTop = newTop <= 0 ? 0 : window.innerHeight - currentLogo.size;
      }

      // Bounce on horizontal edges
      if (newLeft <= 0 || newLeft >= window.innerWidth - currentLogo.size) {
        currentLogo.velocityX *= -1;
        newLeft = newLeft <= 0 ? 0 : window.innerWidth - currentLogo.size;
      }

      // Update logo position
      this.bouncingLogos.update((logos) =>
        logos.map((l) => (l.id === logo.id ? { ...l, top: newTop, left: newLeft } : l))
      );

      // Continue animation
      currentLogo.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }
}
