// COMPONENT TYPE: Shared UI
// ROLE: Render a compact, data-driven concept schema with file navigation.
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LessonInline } from '../lesson-inline/lesson-inline';

/** One editable file node inside a schema step. */
export interface LessonDiagramNode {
  id: string;
  label: string;
  file: string;
  detail?: string;
}

/** Arrow between two consecutive steps. Direction is visual, not an import relation. */
export interface LessonDiagramConnection {
  direction: 'up' | 'down';
  label: string;
}

/** A horizontal row of related nodes and the link to the next row. */
export interface LessonDiagramStep {
  nodes: readonly LessonDiagramNode[];
  connection?: LessonDiagramConnection;
}

/** A named scope or role boundary containing a vertical flow. */
export interface LessonDiagramGroup {
  title: string;
  steps: readonly LessonDiagramStep[];
}

/** Optional lesson schema shown between the live preview and the editor. */
export interface LessonDiagramData {
  title: string;
  description: string;
  groups: readonly LessonDiagramGroup[];
  note?: string;
}

/** Read-only concept renderer: nodes stay real buttons and arrows stay decorative. */
@Component({
  selector: 'app-lesson-diagram',
  imports: [LessonInline, MatButtonModule, MatIconModule],
  templateUrl: './lesson-diagram.html',
  styleUrl: './lesson-diagram.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonDiagram {
  readonly id = 'diagram-' + crypto.randomUUID();
  readonly data = input.required<LessonDiagramData>();
  readonly activeFile = input('');
  readonly fileSelect = output<string>();

  isActive(node: LessonDiagramNode): boolean {
    return node.file === this.activeFile();
  }

  nodeLabel(node: LessonDiagramNode): string {
    return `Apri ${node.label}, file ${node.file}`;
  }
}
