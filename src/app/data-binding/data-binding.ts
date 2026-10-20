// COMPONENT TYPE: Container
// ROLE: Teach through the same editable source executed by the isolated Angular preview.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { BINDING_EXAMPLE } from './binding.example';
import { BINDING_DIAGRAM } from './data-binding-diagrams';

@Component({
  selector: 'app-data-binding',
  imports: [AngularPlayground, LessonDisclosure, LessonShell],
  templateUrl: './data-binding.html',
  styleUrl: './data-binding.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataBinding {
  readonly example = BINDING_EXAMPLE;
  readonly diagram = BINDING_DIAGRAM;
}
