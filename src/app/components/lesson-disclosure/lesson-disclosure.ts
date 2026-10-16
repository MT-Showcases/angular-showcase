// COMPONENT TYPE: Shared UI
// ROLE: Accessible optional explanations with fragment-driven expansion and public Material APIs.
import { ChangeDetectionStrategy, Component, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatExpansionModule, MatExpansionPanelHeader } from '@angular/material/expansion';

/** Optional lesson depth. @example <app-lesson-disclosure anchor="code" title="Codice">...</app-lesson-disclosure> */
@Component({
  selector: 'app-lesson-disclosure',
  imports: [MatExpansionModule],
  template: `<mat-expansion-panel [id]="anchor()" [expanded]="expanded()" (opened)="expanded.set(true)" (closed)="expanded.set(false)" (afterExpand)="focusLinkedHeader()">
    <mat-expansion-panel-header><mat-panel-title>{{ title() }}</mat-panel-title></mat-expansion-panel-header>
    <div class="lesson-disclosure__content"><ng-content /></div>
  </mat-expansion-panel>`,
  styles: `.lesson-disclosure__content { display: grid; gap: 1.5em; min-width: 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonDisclosure {
  readonly anchor = input.required<string>();
  readonly title = input.required<string>();
  readonly expanded = signal(false);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);
  private readonly header = viewChild(MatExpansionPanelHeader);
  private linkedFocus = false;
  constructor() {
    effect(() => {
      if (this.fragment() === this.anchor()) {
        this.linkedFocus = true;
        untracked(() => {
          if (this.expanded()) this.focusLinkedHeader();
          else this.expanded.set(true);
        });
      }
    });
  }
  focusLinkedHeader(): void {
    if (this.linkedFocus && this.header()) {
      this.header()!.focus();
      this.linkedFocus = false;
    }
  }
}
