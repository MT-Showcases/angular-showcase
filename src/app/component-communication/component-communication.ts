// COMPONENT TYPE: Container
// ROLE: Teach through the same editable source executed by the isolated Angular preview.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { COMMUNICATION_EXAMPLE } from './communication.example';

@Component({
  selector: 'app-component-communication',
  imports: [AngularPlayground, LessonDisclosure, LessonShell],
  templateUrl: './component-communication.html',
  styleUrl: './component-communication.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentCommunication {
  readonly example = COMMUNICATION_EXAMPLE;
}
