# Commenting Standards

## 📋 Overview
This document defines commenting standards for the Angular Showcase project. These standards enable both human developers and AI assistants to maintain consistent, high-quality code.

## 🎯 Philosophy

> **A developer opening any file should immediately understand its role, responsibilities, and patterns used—even without reading the full implementation.**

Comments should focus on:
- ✅ **Architectural intent** and responsibilities
- ✅ **Patterns used** and why
- ✅ **Guidelines for contributors**
- ❌ **NOT trivial details** like "increment by one"

## 📝 Comment Types

### 1. File-Level Header Comment

**Every significant TypeScript file** (components, services, facades, NgRx files, configs, utilities) must have a file-level header.

#### Template

```typescript
// COMPONENT TYPE: <Container | Presentational | Shared UI | Facade Service | Store | Config | Utility>
// SECTION: <High-level area, e.g., "Angular Signals", "Reactive Forms", "HTTP", "State Management">
//
// ROLE:
// - <Bullet 1 explaining what this file is responsible for>
// - <Bullet 2>
// - <Bullet 3>
//
// PATTERNS USED:
// - <Pattern 1, e.g., "Container/Presentational split">
// - <Pattern 2, e.g., "Signals for local UI state">
// - <Pattern 3, e.g., "RxJS for async flows">
//
// NOTES FOR CONTRIBUTORS:
// - <Guideline 1 for future modifications>
// - <Guideline 2, e.g., "Do not add complex layout here">
// - <Guideline 3, e.g., "Do not fetch data here">
```

#### Example: Container Component

```typescript
// COMPONENT TYPE: Container
// SECTION: Angular Signals
//
// ROLE:
// - Orchestrate data fetching and state management for Signals showcase
// - Handle navigation between different signal examples
// - Wire up events from presentational components
//
// PATTERNS USED:
// - Container/Presentational split
// - Signals for local UI state
// - RxJS for async data fetching
//
// NOTES FOR CONTRIBUTORS:
// - Keep UI logic in presentational child components
// - Use signals for simple state, RxJS for async operations
// - Add new examples to the examples array, UI will auto-update
```

#### Example: Presentational Component

```typescript
// COMPONENT TYPE: Presentational
// SECTION: Shared UI Components
//
// ROLE:
// - Display a concept card with icon, title, and description
// - Emit click events for navigation
// - Provide consistent visual style for concept cards
//
// PATTERNS USED:
// - Pure presentational component (no data fetching)
// - @Input() for data, @Output() for events
// - BEM methodology for styling
//
// NOTES FOR CONTRIBUTORS:
// - Do not add navigation logic here
// - Keep this component stateless
// - Follow the ConceptCardData interface for inputs
```

#### Example: Facade Service

```typescript
// COMPONENT TYPE: Facade Service
// SECTION: State Management
//
// ROLE:
// - Expose simplified API for accessing NgRx store
// - Hide store implementation details from components
// - Provide type-safe selectors and actions
//
// PATTERNS USED:
// - Facade pattern for store abstraction
// - RxJS observables for reactive data streams
// - Strongly typed actions and selectors
//
// NOTES FOR CONTRIBUTORS:
// - Add new facade methods when adding store features
// - Keep components unaware of store structure
// - Document each public method's purpose
```

---

### 2. Pattern Comments

For **recurring architectural patterns**, add a labeled comment block explaining the pattern's intent.

#### Template

```typescript
// PATTERN: <Pattern name>
// PURPOSE:
// - <Why this pattern is used>
// - <What problem it solves>
// - <How it benefits the architecture>
```

#### Example: Facade Service Pattern

```typescript
// PATTERN: Facade service
// PURPOSE:
// - Expose a simplified API to components
// - Hide NgRx or lower-level implementation details
// - Keep components focused on presentation and orchestration
@Injectable({ providedIn: 'root' })
export class SignalsFacadeService {
  // ...
}
```

#### Example: Config/Definition Object

```typescript
// PATTERN: Topic definition
// PURPOSE:
// - Used by UI to build cards, deep-dive panels, and navigation
// - Provides consistent structure for all topic metadata
// - Changing this shape impacts multiple views across the app
export interface TopicDefinition {
  id: string;
  title: string;
  icon: string;
  description: string;
  examples: Example[];
}
```

#### Example: Container/Presentational Split

```typescript
// PATTERN: Container/Presentational split
// PURPOSE:
// - Container handles data, state, and orchestration
// - Presentational components focus purely on UI rendering
// - Improves testability and reusability
@Component({
  selector: 'app-signals-container',
  // ...
})
export class SignalsContainerComponent {
  // ...
}
```

---

### 3. Micro-Comments

**Add comments inside functions only when:**
- ✅ There is a non-obvious decision or trade-off
- ✅ Code is intentionally simplified for educational purposes
- ✅ There is a workaround or limitation to document

**Avoid obvious comments** like `// Increment count by one`.

#### Examples of Good Micro-Comments

```typescript
// We keep this example intentionally naive to focus on signal usage.
// In a real app, this selection would likely come from a store or facade.
const selectedExample = signal<SignalExample | null>(null);

// Workaround: We debounce here because the API has rate limiting.
// Consider moving this to the service layer in production.
const debouncedSearch$ = this.searchTerm$.pipe(
  debounceTime(300)
);

// Educational simplification: Using local signal instead of store.
// This makes the example easier to understand for beginners.
const count = signal(0);
```

#### Examples of Bad Micro-Comments

```typescript
// ❌ BAD: Obvious
// Increment the count
count++;

// ❌ BAD: Redundant
// Call the getUserById method with the id parameter
this.userService.getUserById(id);

// ❌ BAD: Just restating the code
// Check if user is not null
if (user !== null) {
  // ...
}
```

---

## 🔄 Behavior When Generating or Editing Files

### Creating New Files

**Always:**
1. ✅ Add the file-level header comment using the standard structure
2. ✅ Add pattern comments for any recurring architectural pattern used
3. ✅ Ensure the code:
   - Respects container/presentational split when applicable
   - Is consistent with existing naming and folder structure
   - Uses Signals for local state in UI components when practical

### Editing Existing Files

**When modifying:**
1. 🔄 If the role changes, update the header comment
2. ➕ If introducing a new pattern, add/adjust the PATTERN comment
3. ✅ Keep wording and structure consistent with existing project comments
4. 🧹 Remove outdated comments that no longer apply

---

## 📏 Style Guidelines

### Consistency Over Originality

**Comments should be intentionally consistent across similar files.**

Example: All facade services should have nearly identical PATTERN comments. This is **by design**, not laziness. It helps both humans and AI assistants recognize and maintain patterns.

### Focus on Architecture, Not Implementation

**Good:**
```typescript
// ROLE:
// - Orchestrate data fetching for the signals showcase
// - Manage navigation between examples
```

**Bad:**
```typescript
// ROLE:
// - This component has a method called fetchData() that calls a service
// - It uses ngOnInit to initialize the component
```

### Write for Contributors

**Good:**
```typescript
// NOTES FOR CONTRIBUTORS:
// - Add new signal examples to the examples array
// - Keep state management simple with signals
// - Avoid adding HTTP calls here—use the facade service
```

**Bad:**
```typescript
// NOTES FOR CONTRIBUTORS:
// - This file uses TypeScript
// - Follow Angular best practices
```

---

## ✅ Checklist for Comments

Before committing code, verify:

- [ ] File has a header comment with all required sections
- [ ] COMPONENT TYPE accurately describes the file
- [ ] ROLE bullets explain responsibilities clearly
- [ ] PATTERNS USED lists all architectural patterns employed
- [ ] NOTES FOR CONTRIBUTORS provide actionable guidelines
- [ ] Pattern comments are added for recurring structures
- [ ] Micro-comments explain only non-obvious decisions
- [ ] Comments are consistent with similar files in the project
- [ ] No trivial or redundant comments exist

---

## 🤖 AI-Assisted Maintenance

These commenting standards enable AI assistants to:
- ✅ Generate new files that match existing patterns
- ✅ Maintain consistency across similar components
- ✅ Recognize architectural patterns and apply them correctly
- ✅ Update comments when code structure changes

**However, the code remains fully human-readable:**
- 👥 Comments focus on intent, not mechanics
- 📖 Patterns are clearly labeled and explained
- 🏗️ Architecture is idiomatic Angular, not AI-optimized obscurity

---

## 📚 Examples

### Complete Component Example

```typescript
// COMPONENT TYPE: Container
// SECTION: HTTP and Async Operations
//
// ROLE:
// - Fetch and display user data from an API
// - Handle loading and error states
// - Orchestrate navigation to user detail pages
//
// PATTERNS USED:
// - Container/Presentational split
// - RxJS observables for async data
// - Signal-based loading state
//
// NOTES FOR CONTRIBUTORS:
// - Use UsersFacadeService for data access
// - Keep UI rendering in UserListPresentational component
// - Add error handling for API failures

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersFacadeService } from '@services/users-facade.service';

@Component({
  selector: 'app-user-list-container',
  standalone: true,
  imports: [CommonModule, UserListPresentationalComponent],
  templateUrl: './user-list-container.html',
})
export class UserListContainerComponent {
  // PATTERN: Signal-based loading state
  // PURPOSE:
  // - Provide reactive loading indicator
  // - Simplify template logic with computed signals
  isLoading = signal(false);
  
  constructor(private usersFacade: UsersFacadeService) {}
  
  ngOnInit() {
    this.loadUsers();
  }
  
  private loadUsers() {
    this.isLoading.set(true);
    
    // Educational simplification: Direct subscription for clarity.
    // In production, consider using AsyncPipe or a facade method.
    this.usersFacade.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.isLoading.set(false);
      }
    });
  }
}
```

---

**Remember**: Good comments explain **why** and **what for**, not **how** (the code already shows the how).
