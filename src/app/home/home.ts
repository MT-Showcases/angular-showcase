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
import { Icon } from '../components/icon/icon';

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
  imports: [RouterLink, FeatureCard, Icon],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.scss',
})
export class Home {
  featureCards: Feature[] = [
    {
      routerLink: '/basics/data-binding',
      iconName: 'data-binding',
      title: 'Data Binding',
      description: 'Esempi di binding bidirezionale',
      features: ['Property Binding', 'Event Binding', 'Two-way Binding [(ngModel)]'],
    },
    {
      routerLink: '/basics/directives',
      iconName: 'directives',
      title: 'Directives',
      description: 'Direttive strutturali e di attributo',
      features: ['@if, @for, @switch', 'ngClass, ngStyle', 'Custom Directives'],
    },
    {
      routerLink: '/basics/forms',
      iconName: 'form',
      title: 'Forms',
      description: 'Reactive Forms con validazione avanzata',
      features: ['FormGroup e FormControl', 'Validatori custom', 'Feedback visivo real-time'],
    },
    {
      routerLink: '/advanced/signals',
      iconName: 'signals',
      title: 'Signals',
      description: 'Angular Signals API con esempi pratici',
      features: ['Writable Signals', 'Computed Signals', 'Effects', 'Carrello reattivo'],
    },
    {
      routerLink: '/advanced/http',
      iconName: 'http',
      title: 'HTTP & Services',
      description: 'Richieste HTTP con Service Facade Pattern',
      features: [
        'GET, POST, PUT, DELETE',
        'Observable e subscribe',
        'Service Facade best practices',
      ],
    },
    {
      routerLink: '/examples/users',
      iconName: 'users',
      title: 'Users',
      description: 'Gestione utenti con componenti standalone, Signals e Service',
      features: ['Lista utenti dinamica', 'Ricerca in tempo reale', 'Cards con animazioni'],
    },
  ];
}
