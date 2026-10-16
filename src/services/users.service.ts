// COMPONENT TYPE: Facade Service
// SECTION: HTTP and Data Access
//
// ROLE:
// - Provide users data access layer
// - Handle HTTP requests to external API
// - Manage users state with Signals
// - Provide filtering and CRUD operations
//
// PATTERNS USED:
// - Service Facade pattern
// - Signal-based reactive state
// - Auto-fetch on service initialization
// - Filtering with local state
//
// NOTES FOR CONTRIBUTORS:
// - Keep HTTP logic in this service, not in components
// - baseUsers stores original data, users signal is filtered view
// - Auto-fetches on initialization (consider lazy loading for production)
// - Add error handling for HTTP failures in production

import { Injectable, signal } from '@angular/core';
import { User } from '../types/users';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  // Base users array (unfiltered)
  baseUsers: User[] = [];

  // Reactive signal for filtered users
  users = signal<User[]>([]);

  private searchTerm = '';

  /**
   * Constructor initializes service with HTTP client and loads users.
   * Automatically fetches users when service is instantiated.
   *
   * @param http - HTTP client for API requests
   */
  constructor(private http: HttpClient) {
    // Load users on service initialization
    this.fetchUsers();
  }

  // Fetch users from external API
  fetchUsers() {
    this.http.get<User[]>('https://jsonplaceholder.typicode.com/users').subscribe((users) => {
      this.baseUsers = users;
      this.filterUsers(this.searchTerm);
    });
  }

  // Filter users based on search string (name or email)
  filterUsers(search?: string) {
    this.searchTerm = (search || '').toLowerCase().trim();

    this.users.set(
      this.baseUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(this.searchTerm) ||
          user.email.toLowerCase().includes(this.searchTerm)
      )
    );
  }

  // Update users list
  setUsers(users: User[]) {
    this.users.set(users);
  }

  // Delete user by ID
  deleteUser(userId: number) {
    this.baseUsers = this.baseUsers.filter((user) => user.id !== userId);
    this.filterUsers(this.searchTerm);
  }
}
