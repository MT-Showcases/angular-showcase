// COMPONENT TYPE: Container
// ROLE: Present published learning paths from the shared topic registry.
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeatureCard } from '../components/feature-card/feature-card';
import { TOPICS } from '../learning/topics';

// PATTERN: Feature definition
// PURPOSE:
// - Provides consistent structure for feature card data
// - Used by template to render navigation cards
// - Changing this interface requires updating all feature definitions
interface Feature {
  routerLink: string;
  iconName: string;
  title: string;
  description: string;
  features: string[];
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, FeatureCard],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.scss',
})
export class Home {
  readonly paths = [
    { category: 'basics', title: 'Parti dalle Basi', description: 'Dal primo componente a servizi e routing, un concetto alla volta.', route: '/basics' },
    { category: 'advanced', title: 'Esplora Avanzato', description: 'Stato reattivo e richieste HTTP, con esperimenti e casi di errore.', route: '/advanced' },
  ];
  cards(category: string): Feature[] {
    return TOPICS.filter(topic => topic.published && topic.category === category).map(topic => ({
      routerLink: topic.route,
      iconName: topic.id === 'forms' ? 'form' : topic.id === 'http' ? 'http' : topic.id === 'signals' ? 'signals' : 'component',
      title: topic.title,
      description: topic.outcome,
      features: ['Demo guidata', 'Codice spiegato', 'Approfondimenti facoltativi'],
    }));
  }
}
