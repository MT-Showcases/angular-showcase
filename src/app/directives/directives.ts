// COMPONENT TYPE: Container
// ROLE: Teach through the same editable source executed by the isolated Angular preview.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { CONTROL_FLOW_EXAMPLE } from './control-flow.example';

@Component({
  selector: 'app-directives',
  imports: [AngularPlayground, LessonDisclosure, LessonShell],
  templateUrl: './directives.html',
  styleUrl: './directives.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Directives {
  readonly example = CONTROL_FLOW_EXAMPLE;
}
