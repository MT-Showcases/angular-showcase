# Copilot Instructions - Angular Showcase

> **📚 Detailed Documentation**: This file provides a high-level overview. For detailed guidelines, see:
> - [Project Structure](./copilot-instructions/project-structure.md) - Directory organization and file naming
> - [Styling Conventions](./copilot-instructions/styling-conventions.md) - SCSS best practices (mobile-first, rem(), BEM)
> - [Commenting Standards](./copilot-instructions/commenting-standards.md) - File headers, pattern comments, AI-assisted conventions
> - [Reusable Components](./copilot-instructions/reusable-components.md) - Component documentation standards
> - [TypeScript Conventions](./copilot-instructions/typescript.md) - TypeScript best practices (TODO)

## 🤖 AI-Assisted Development Approach

This project is **AI-assistant friendly** while remaining fully human-readable. Code is structured so that tools like GitHub Copilot can recognize patterns, generate consistent code, and maintain documentation standards—but the architecture is idiomatic Angular that any developer can understand and modify.

**Key principles:**
- 📝 File-level headers describe component type, role, patterns, and contributor notes
- 🏗️ Pattern comments label recurring architectural constructs
- 🎯 Micro-comments only for non-obvious decisions
- ✅ Consistent naming and structure across similar files
- 👥 Human-first code + AI-assisted efficiency

See [Commenting Standards](./copilot-instructions/commenting-standards.md) for complete guidelines.

## 🌍 Language Policy

### Code & Technical Content (English Only)
**ALL code, comments, and technical documentation MUST be in English:**
- Variable names, function names, class names: English only
- Code comments: English only
- Technical documentation (README, inline docs): English only
- Commit messages: English only
- Console logs and error messages: English only

### User-Facing Content (Italian)
**ALL user-facing text in templates MUST be in Italian:**
- HTML template text content: Italian
- Button labels, headings, descriptions: Italian
- Error messages shown to users: Italian
- Form labels and placeholders: Italian
- Toast notifications and alerts: Italian

**Rationale**: The application is currently targeted for Italian users. Internationalization (i18n) will be implemented in the future to support multiple languages.

## 🎯 Project Overview
This is an Angular 18+ standalone project showcasing the main framework features through interactive examples and demos.

## 📐 Architecture and Conventions

### Components
- **All components are standalone** (no NgModule)
- **Naming convention**: PascalCase for classes, kebab-case for files
- **Component file structure**:
  ```
  component-name/
    component-name.ts
    component-name.html
    component-name.scss
    component-name.spec.ts (opzionale)
  ```
- **Reusable components**: Must be fully documented (see [Reusable Components Guide](./copilot-instructions/reusable-components.md))
  - TypeScript: JSDoc with `@example`, interface exports
  - HTML: Section comments explaining structure
  - SCSS: Detailed comments with section markers
- **Import order in components**:
  1. Angular core (`@angular/core`, `@angular/common`)
  2. Angular routing (`@angular/router`)
  3. RxJS
  4. Internal components (using path aliases)
  5. Services
  6. Types/Interfaces

### Routing
- **Hierarchical structure**:
  - `/` - Home
  - `/basics/*` - Basic concepts (data-binding, directives, forms)
  - `/advanced/*` - Advanced concepts (signals, http)
  - `/state/*` - State management (ngrx, behavior-subject)
  - `/examples/*` - Practical examples (users)

### Styling

> **📘 Detailed SCSS Guidelines**: For comprehensive styling conventions, see [Styling Conventions](./copilot-instructions/styling-conventions.md)

#### Quick Reference

**Global SCSS Import**:
```scss
@use 'globals' as *;
// Now you have access to all SCSS variables, mixins, and functions
```

**Key Principles**:
- ✅ **Mobile-first**: Always use `@include media-min-breakpoint()`
- ✅ **rem() function**: Convert all sizes (no px/rem literals)
- ✅ **BEM methodology**: Use `&__` for elements, `&--` for modifiers
- ✅ **Class-based selectors**: Never use direct HTML tag selectors
- ✅ **SCSS variables**: Use `$primary`, `$white`, etc. (not CSS custom properties)

**Most Common Variables**:
- Colors: `$primary`, `$white`, `$neutral-*`, `$blue-*`
- Transitions: `$transition` (already includes 'all')
- Breakpoints: xs, sm, md (768px), lg (1024px), xl, xxl

**Most Common Mixins**:
- `@include flex($justify, $align)`
- `@include media-min-breakpoint(md)` - Tablet and up
- `@include media-min-breakpoint(lg)` - Desktop and up

**Example**:
```scss
@use 'globals' as *;

.card {
  padding: rem(16); // Mobile base
  background: $white;
  transition: $transition;
  
  &__title {
    font-size: rem(18);
    color: $neutral-darkest;
  }
  
  // Tablet and up
  @include media-min-breakpoint(md) {
    padding: rem(24);
    
    &__title {
      font-size: rem(20);
    }
  }
}
```

#### Global Typography Classes
Available throughout the project without import:

**Sizes**: `.display-xl`, `.display-l`, `.display-md`, `.body-md`, `.body-s`, `.body-xs`, `.body-xxs`, `.body-xxxs`

**Weights**: `.regular`, `.medium`, `.semibold`, `.bold`

**Styles**: `.italic`, `.uppercase`, `.lowercase`, `.capitalize`, `.underline`, `.ellipsis`

**Text colors**: `.primary-text`, `.white-text`, `.neutral-text`, `.success-text`, `.error-text`, etc.

**Alignment**: `.text-left`, `.text-right`, `.text-center`, `.text-justify`

### TypeScript Path Aliases
Configured in `tsconfig.json`:
```typescript
import { Component } from '@app/component-name/component-name';
import { FeatureCard } from '@components/feature-card/feature-card';
import { UsersService } from '@services/users.service';
import { LinkInterceptor } from '@directives/link-interceptor';
```

**Available paths**:
- `@app/*` → `src/app/*`
- `@components/*` → `src/app/components/*`
- `@services/*` → `src/services/*`
- `@directives/*` → `src/app/directives/*`

### State Management

#### Signals (Preferred for new code)
```typescript
// Writable signal
count = signal(0);
increment() { this.count.update(v => v + 1); }

// Computed signal
double = computed(() => this.count() * 2);

// Effect
constructor() {
  effect(() => console.log(this.count()));
}
```

#### NgRx (for complex global state)
- Central store in `src/app/store/`
- Actions, Reducers, Selectors separated by feature
- Use `@ngrx/store` for the store
- Use `@ngrx/effects` for side effects (if needed)

#### BehaviorSubject (for services with state)
```typescript
private dataSubject = new BehaviorSubject<Data>(initialValue);
data$ = this.dataSubject.asObservable();

// Expose only the Observable, not the Subject
```

### Reusable Components

#### Icon Component
```html
<app-icon name="icon-name" />
```
Available icons: `data-binding`, `directives`, `form`, `users`, `signals`, `http`, `ngrx`, `plus`, `play`, `pause`, `close`, `check`, `error`, `warning`, `info`

#### PageHeader Component
```html
<app-page-header
  title="Page Title"
  subtitle="Brief description">
</app-page-header>
```

#### CodeBlock Component
```html
<app-code-block
  [code]="codeString"
  language="typescript">
</app-code-block>
```

#### FeatureCard Component
```html
<app-feature-card
  icon="icon-name"
  title="Title"
  description="Description">
</app-feature-card>
```

### Patterns and Best Practices

#### Form Management
- Use `ReactiveFormsModule` for complex forms
- Use `FormBuilder` to create form groups
- Custom validators in separate file if complex

#### HTTP Requests
- Service Facade pattern: HTTP logic in services, not in components
- Use `HttpClient` with typed responses
- Centralized error handling in service

#### Performance
- Use `@defer` for lazy loading heavy components
- `trackBy` in `@for` loops
- `OnPush` change detection for presentational components (if needed)

#### Accessibility
- `user-select: none` is global by default
- Re-enable with `.code-block { user-select: text; }` where needed
- Always `alt` text on images
- Labels associated with form inputs

### File Structure
```
src/
  app/
    components/          # Reusable components
    directives/          # Custom directives
    store/              # NgRx store
    [feature]/          # Feature components (one per route)
  services/             # Shared services
  styles/               # Global SCSS
    _globals.scss       # Central import
    _colors.scss        # Color palette
    _variables.scss     # SCSS variables
    _mixins.scss        # Mixins and functions
    _typography.scss    # Typography classes
  types/                # TypeScript interfaces/types
```

### Build & Budget
- Initial bundle budget: 500kB warning, 1MB error
- Component styles budget: 10kB warning, 20kB error
- If an SCSS file exceeds 10kB → consider extracting sub-components

## 🚀 Common Commands
```bash
npm start          # Dev server (localhost:4200)
npm run build      # Build produzione
npm test           # Run tests
```

## 📝 When Creating New Code

### New Component
1. Create folder `component-name/` under the correct feature
2. `.ts` file with standalone decorator
3. Add `@use 'globals' as *;` in `.scss` if using variables/mixins
4. Import in components using path aliases when possible

### New Service
1. Create in `src/services/`
2. `@Injectable({ providedIn: 'root' })`
3. Service Facade pattern for HTTP

### New Route
1. Add in `app.routes.ts`
2. Organize under the correct group (basics/advanced/state/examples)
3. Lazy-loaded component if heavy

### New Icon
1. Add SVG in `icon.html` inside switch
2. Follow the same pattern as existing ones
3. Color: `currentColor` to inherit from parent

## 🎨 Style Guide

### Naming
- **Components**: `UserList`, `DataBinding`
- **Services**: `UsersService`, `PostsService`
- **Interfaces**: `User`, `Post`, `TodoItem`
- **Files**: `user-list.ts`, `data-binding.html`

### Comments
- Use comments for complex logic
- Document configurations with inline comments
- Logical sections with headers `// ═══ SECTION ═══`
- **All comments must be in English**

### Formatting
- 2 spaces indentation
- Single quotes for strings
- Trailing comma in multi-line arrays/objects
- Prettier + ESLint for auto-formatting

## ⚠️ Things NOT to Do
- ❌ Don't use NgModule (everything standalone)
- ❌ Don't import SCSS files in component styles (use `@use 'globals'`)
- ❌ Don't use `any` type (always explicit types)
- ❌ Don't expose BehaviorSubject directly (only Observable via `asObservable()`)
- ❌ Don't put business logic in components (use services)
- ❌ Don't use `@import` in SCSS (use `@use` or `@forward`)
- ❌ Don't increase budgets without optimizing code first
- ❌ Don't use Italian in code, comments, or documentation
- ❌ **NEVER use direct HTML tag selectors in SCSS** (always use classes)
- ❌ **NEVER use px or rem literals** (always use `rem()` function for all sizes)
- ❌ **NEVER use desktop-first approach** (always use mobile-first with `@include media-min-breakpoint()`)

## 🎯 Project Goals
- Show modern Angular best practices
- Clean and maintainable code
- Practical and interactive examples
- Performance and accessibility
