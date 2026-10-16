// COMPONENT TYPE: Presentational
// SECTION: Shared UI Components
//
// ROLE:
// - Display step-by-step guide sections with numbered badges
// - Show title, explanation, optional code example, and explanation box
// - Provide consistent structure for tutorial content
//
// PATTERNS USED:
// - Pure presentational component (@Input only)
// - Composition with CodeBlock for syntax highlighting
// - Exported data interface for type safety
// - Optional nested interfaces for flexible content
//
// NOTES FOR CONTRIBUTORS:
// - Keep this component stateless
// - All data comes from @Input properties
// - Used primarily in ngrx-concepts for step-by-step guides
// - Both codeExample and explanationBox are optional

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { CodeBlock } from '@components/code-block/code-block';
import { CodeLanguage } from '@models/code';

/**
 * Interface for GuideStep data structure
 *
 * @property stepNumber - Number to display in circular badge
 * @property title - Step title (can include emoji)
 * @property explanation - Explanation text for the step
 * @property codeExample - Optional code example block
 * @property explanationBox - Optional explanation box with title and points
 *
 * @example
 * ```html
 * <app-guide-step
 *   [stepNumber]="1"
 *   title="Define State Interface"
 *   explanation="Create TypeScript interfaces that describe the shape of your data."
 *   [codeExample]="{ title: 'File: store/counter.state.ts', code: stateCode }"
 *   [explanationBox]="{ title: 'What are we doing?', points: ['Define state structure', 'Set initial values'] }">
 * </app-guide-step>
 * ```
 */
export interface GuideStepData {
  stepNumber: number;
  title: string;
  explanation: string;
  codeExample?: {
    title: string;
    code: string;
    language?: CodeLanguage;
    description?: string;
  };
  explanationBox?: {
    title: string;
    content?: string;
    points?: string[];
  };
}

@Component({
  selector: 'app-guide-step',
  standalone: true,
  imports: [CodeBlock],
  templateUrl: './guide-step.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './guide-step.scss',
})
export class GuideStep {
  /** Step number to display in the circular badge */
  @Input({ required: true }) stepNumber!: number;

  /** Step title with emoji (e.g., "📋 Define State Interface") */
  @Input({ required: true }) title!: string;

  /** Explanation text describing what this step does */
  @Input({ required: true }) explanation!: string;

  /** Optional code example block */
  @Input() codeExample?: {
    title: string;
    code: string;
    language?: CodeLanguage;
    description?: string;
  };

  /** Optional explanation box with tips and details */
  @Input() explanationBox?: {
    title: string;
    content?: string;
    points?: string[];
  };
}
