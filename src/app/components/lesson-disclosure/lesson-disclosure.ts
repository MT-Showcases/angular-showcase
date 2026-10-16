// COMPONENT TYPE: Shared UI
// ROLE: Accessible optional explanations with fragment-driven expansion and public Material APIs.
import { ChangeDetectionStrategy, Component, afterRenderEffect, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MatExpansionModule, MatExpansionPanelHeader } from '@angular/material/expansion';

/** Optional lesson depth. @example <app-lesson-disclosure anchor="code" title="Codice">...</app-lesson-disclosure> */
@Component({
  selector: 'app-lesson-disclosure',
  imports: [MatExpansionModule],
  template: `<mat-expansion-panel [id]="anchor()" [expanded]="expanded()" (opened)="expanded.set(true)" (closed)="expanded.set(false)" (afterExpand)="focusLinkedHeader()">
    <mat-expansion-panel-header class="lesson-disclosure__header"><mat-panel-title>{{ title() }}</mat-panel-title></mat-expansion-panel-header>
    <div class="lesson-disclosure__content"><ng-content /></div>
  </mat-expansion-panel>`,
  styles: `@use 'globals' as *;
    :host { display: block; min-width: 0; scroll-margin-top: rem(120); }
    .lesson-disclosure__header { height: auto; min-height: rem(64); padding-block: space(3); }
    .lesson-disclosure__content { display: grid; gap: space(6); min-width: 0; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonDisclosure {
  readonly anchor = input.required<string>();
  readonly title = input.required<string>();
  readonly expanded = signal(false);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);
  private readonly header = viewChild(MatExpansionPanelHeader);
  private readonly linkedFocus = signal(false);
  constructor() {
    effect(() => {
      if (this.fragment() === this.anchor()) {
        untracked(() => {
          this.linkedFocus.set(true);
          this.expanded.set(true);
        });
      }
    });
    // Initial fragment navigation can start expanded, without an afterExpand event.
    afterRenderEffect(() => {
      if (this.linkedFocus() && this.expanded() && this.header()) this.focusLinkedHeader();
    });
  }
  focusLinkedHeader(): void {
    if (this.linkedFocus() && this.header()) {
      this.header()!.focus();
      this.linkedFocus.set(false);
    }
  }
}
