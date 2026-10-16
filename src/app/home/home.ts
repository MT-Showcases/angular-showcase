// COMPONENT TYPE: Container
// SECTION: Home Page
//
// ROLE:
// - Display the main landing page with overview of all Angular features
// - Organize feature cards into logical sections (basics, advanced, state management)
// - Provide navigation entry points to all major showcases
//
// PATTERNS USED:
// - Standalone component architecture
// - Configuration-driven UI (feature array)
// - Responsive grid layout for feature cards
//
// NOTES FOR CONTRIBUTORS:
// - Add new features to the featureCards array, UI will auto-update
// - Keep descriptions concise and in Italian (user-facing content)
// - Maintain consistent feature card structure across all sections
// - Icons must be registered in the Icon component

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
    { category: 'basics', title: 'Parti dalle Basi', description: 'Dal primo componente ai form, un concetto alla volta.', route: '/basics' },
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
