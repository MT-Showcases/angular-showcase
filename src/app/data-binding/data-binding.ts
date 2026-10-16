// COMPONENT TYPE: Container
// ROLE: Introduce binding through an editable, reversible example.
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { CodeBlock } from '../components/code-block/code-block';
@Component({
  selector: 'app-data-binding',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, LessonShell, LessonDisclosure, CodeBlock],
  templateUrl: './data-binding.html',
  styleUrl: './data-binding.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class DataBinding {
  name = 'Ada';
  readonly example = `import { FormsModule } from '@angular/forms';
// Add FormsModule to the standalone component imports.
name = 'Ada';
// Template: <input [(ngModel)]="name" /> <p>{{ name }}</p>`;
  reset(): void { this.name = 'Ada'; }
}
