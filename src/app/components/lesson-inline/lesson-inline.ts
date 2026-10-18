// COMPONENT TYPE: Shared UI
// ROLE: Render the limited inline formatting supported by lesson prompt and takeaway strings.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type SegmentKind = 'text' | 'strong' | 'code';

interface Segment {
  kind: SegmentKind;
  text: string;
}

/** Supports only **bold keywords** and `inline code`; every other character stays literal. */
@Component({
  selector: 'app-lesson-inline',
  template: `@for (segment of segments(); track $index) {
    @if (segment.kind === 'strong') {
      <strong class="lesson-emphasis">{{ segment.text }}</strong>
    } @else if (segment.kind === 'code') {
      <code class="lesson-code-inline">{{ segment.text }}</code>
    } @else {
      <ng-container>{{ segment.text }}</ng-container>
    }
  }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonInline {
  readonly text = input.required<string>();
  readonly segments = computed(() => parse(this.text()));
}

function parse(text: string): Segment[] {
  const segments: Segment[] = [];
  let plain = '';
  let index = 0;

  const flushPlain = () => {
    if (plain) segments.push({ kind: 'text', text: plain });
    plain = '';
  };

  while (index < text.length) {
    if (text.startsWith('**', index)) {
      const end = text.indexOf('**', index + 2);
      if (end > index + 2) {
        flushPlain();
        segments.push({ kind: 'strong', text: text.slice(index + 2, end) });
        index = end + 2;
        continue;
      }
    }

    if (text[index] === '`') {
      const end = text.indexOf('`', index + 1);
      if (end > index + 1) {
        flushPlain();
        segments.push({ kind: 'code', text: text.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }

    plain += text[index];
    index++;
  }

  flushPlain();
  return segments;
}
