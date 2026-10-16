// COMPONENT TYPE: Presentational
// SECTION: HTTP and Async Operations
//
// ROLE:
// - Display individual user data in card format
// - Emit delete event to parent component
// - Demonstrate component lifecycle hooks (ngOnInit, ngOnDestroy)
//
// PATTERNS USED:
// - Pure presentational component (@Input/@Output pattern)
// - Event-based communication with parent
// - Lifecycle hooks for educational demonstration
//
// NOTES FOR CONTRIBUTORS:
// - Keep this component stateless
// - All data comes from @Input, all actions via @Output
// - Console logs demonstrate lifecycle for learning purposes
// - Do not add HTTP logic here (parent handles data)

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { User } from '../../../types/users';
import { Icon } from '../../components/icon/icon';

@Component({
  selector: 'app-user-card',
  imports: [Icon],
  templateUrl: './user-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './user-card.scss',
})
export class UserCard implements OnInit, OnDestroy {
  // Receives user data from parent component
  @Input() user?: User;

  // Emits user ID to parent component for deletion
  @Output() delete = new EventEmitter<number>();

  // Executed when the component is created
  ngOnInit() {
    console.log(`UserCard for ${this.user?.name} created`);
  }

  // Executed when the component is destroyed
  ngOnDestroy() {
    console.log(`UserCard for ${this.user?.name} destroyed`);
  }

  // Emits delete event with user ID
  handleDelete() {
    this.delete.emit(this.user?.id);
  }
}
