// COMPONENT TYPE: Presentational
// SECTION: Shared UI Components
//
// ROLE:
// - Display concept cards with icon, title, description, code, and key points
// - Provide consistent structure for educational content
// - Support syntax highlighting via CodeBlock component
//
// PATTERNS USED:
// - Pure presentational component (@Input only)
// - Composition with CodeBlock for syntax highlighting
// - Exported data interface for type safety
//
// NOTES FOR CONTRIBUTORS:
// - Keep this component stateless
// - All data comes from @Input properties
// - Used primarily in ngrx-concepts for educational cards
// - Icon can be emoji or icon name from Icon component

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { CodeBlock } from '@components/code-block/code-block';
import { CodeLanguage } from '@models/code';

/**
 * Interface for ConceptCard data structure
 *
 * @property icon - Icon name or emoji to display
 * @property title - Card title
 * @property description - Card description text
 * @property code - Code example to display
 * @property codeLanguage - Language for syntax highlighting (optional, defaults to typescript)
 * @property keyPointsTitle - Title for key points section
 * @property keyPoints - Array of key point strings
 *
 * @example
 * ```html
 * <app-concept-card
 *   icon="🏪"
 *   title="Store"
 *   description="The central container for application state."
 *   [code]="storeCode"
 *   codeLanguage="typescript"
 *   keyPointsTitle="Features:"
 *   [keyPoints]="['Immutable', 'Predictable', 'Centralized']">
 * </app-concept-card>
 * ```
 */
export interface ConceptCardData {
  icon: string;
  title: string;
  description: string;
  code: string;
  codeLanguage?: CodeLanguage;
  keyPointsTitle: string;
  keyPoints: string[];
}

@Component({
  selector: 'app-concept-card',
  standalone: true,
  imports: [CodeBlock],
  templateUrl: './concept-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './concept-card.scss',
})
export class ConceptCard {
  /** Emoji or icon character to display */
  @Input({ required: true }) icon!: string;

  /** Main title of the concept */
  @Input({ required: true }) title!: string;

  /** Detailed description text */
  @Input({ required: true }) description!: string;

  /** Optional code snippet to display */
  @Input() code?: string;

  /** Programming language for syntax highlighting (default: 'typescript') */
  @Input() codeLanguage: CodeLanguage = 'typescript';

  /** Title for the key points section (e.g., "Features:", "Best Practices:") */
  @Input() keyPointsTitle?: string;

  /** Array of key points to display as a list */
  @Input() keyPoints?: string[];
}
