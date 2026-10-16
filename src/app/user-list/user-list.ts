// COMPONENT TYPE: Container
// SECTION: HTTP and Async Operations
//
// ROLE:
// - Demonstrate HTTP requests with real user data
// - Provide search/filter functionality
// - Handle CRUD operations (fetch and delete)
// - Coordinate between UsersService and presentational UserCard components
//
// PATTERNS USED:
// - Service Facade pattern (UsersService handles HTTP)
// - Signal-based search state
// - Effect for automatic filtering when search changes
// - Composition with UserCard for display
//
// NOTES FOR CONTRIBUTORS:
// - Keep HTTP logic in UsersService, not here
// - Search filtering is reactive via effect()
// - UserCard is presentational and receives data via @Input
// - Follow this pattern when adding more user features


import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { User } from '../../types/users';
import { UserCard } from './user-card/user-card';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../services/users.service';
import { PageHeader } from '../page-header/page-header';
import { Icon } from '../components/icon/icon';

@Component({
  selector: 'app-user-list',
  imports: [UserCard, FormsModule, PageHeader, Icon],
  templateUrl: './user-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './user-list.scss',
})
export class UserList {
  // Inject the users service via Dependency Injection
  usersService = inject<UsersService>(UsersService);

  // Signal containing the search text
  search = signal<string>('');

  constructor() {
    // Effect that triggers when search changes, automatically filters users
    effect(() => {
      this.usersService.filterUsers(this.search());
    });
  }

  // Getter to access users from the service
  get users(): User[] {
    return this.usersService.users();
  }

  // Reload the users list
  fetchUsers() {
    this.usersService.fetchUsers();
  }

  // Delete a user, receives ID from child UserCard component
  deleteUser(userId: number) {
    this.usersService.deleteUser(userId);
  }
}
