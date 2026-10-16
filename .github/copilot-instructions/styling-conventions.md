# Styling Conventions

## 📋 Overview
This document defines universal SCSS styling conventions and best practices for the entire Angular Showcase project. These rules apply to **all SCSS files**: components (reusable and feature-specific), pages, layouts, and directives.

## 🎨 Core Principles

### 1. Mobile-First Approach
**ALWAYS use mobile-first responsive design**:

```scss
// ✅ CORRECT: Mobile-first
.component {
  font-size: rem(16); // Base mobile size
  padding: rem(16);
  
  // Add styles for larger screens
  @include media-min-breakpoint(md) {
    font-size: rem(18); // Tablet
    padding: rem(24);
  }
  
  @include media-min-breakpoint(lg) {
    font-size: rem(20); // Desktop
    padding: rem(32);
  }
}

// ❌ WRONG: Desktop-first
.component {
  font-size: rem(20); // Desktop
  padding: rem(32);
  
  @include media-max-breakpoint(md) {
    font-size: rem(16); // Mobile (redefined)
    padding: rem(16);
  }
}
```

**Benefits**:
- No code duplication
- Progressive enhancement
- Better performance on mobile devices
- Cleaner, more maintainable code
- Aligns with modern web development standards

**When to use `media-max-breakpoint`**:
Only for specific cases where you need to **remove** or **simplify** styles on smaller screens (rare cases).

---

### 2. Size Units
**ALWAYS use `rem()` function for all size values**:

```scss
// ✅ CORRECT: Use rem() function
.component {
  width: rem(300);
  height: rem(200);
  padding: rem(16) rem(24);
  margin-bottom: rem(20);
  border-radius: rem(8);
  font-size: rem(16);
  line-height: rem(24);
  gap: rem(12);
  top: rem(10);
  left: rem(20);
  border: rem(1) solid $neutral-lightest;
  box-shadow: 0 rem(4) rem(8) rgba(0, 0, 0, 0.1);
}

// ❌ WRONG: px or rem literals
.component {
  width: 300px;
  padding: 1rem 1.5rem;
  margin-bottom: 20px;
  border-radius: 0.5rem;
  font-size: 16px;
  border: 1px solid #ccc;
}
```

**Rationale**:
- **Consistent sizing system** across the entire project
- **Easy to scale** the entire design by changing base font-size
- **Better accessibility**: Respects user font-size preferences
- **Centralized control**: All sizing goes through one function
- **Future-proof**: Easy to adapt to different screen densities

**Exceptions** (rare):
- Percentage values: `width: 100%`, `flex: 1`
- Viewport units: `height: 100vh`, `width: 100vw`
- Unitless values: `line-height: 1.5`, `z-index: 10`

---

### 3. SCSS Variables Usage
**ALWAYS use SCSS variables from `_globals.scss`**:

```scss
@use 'globals' as *;

.component {
  // ✅ CORRECT: Use SCSS variables
  color: $neutral-darker;
  background: $white;
  border: rem(1) solid $neutral-lightest;
  transition: $transition; // Already includes 'all'
  
  &:hover {
    color: $primary;
    background: $blue-bg-lighter;
  }
  
  // ❌ WRONG: CSS custom properties, px literals, redundant 'all'
  // color: var(--neutral-darker);
  // border: 1px solid $neutral-lightest;
  // transition: all $transition; // 'all' is redundant!
}
```

**Available SCSS Variables**:

**Colors**:
- Primary: `$primary`, `$primary-dark`, `$primary-light`
- Angular: `$angular-red`, `$angular-red-dark`, `$angular-red-light`
- Neutrals: `$white`, `$black`, `$neutral-darkest`, `$neutral-darker`, `$neutral`, `$neutral-light`, `$neutral-lighter`, `$neutral-lighter-2`, `$neutral-lightest`, `$neutral-bg`
- Blues: `$blue`, `$blue-light`, `$blue-dark`, `$blue-darker`, `$blue-darkest`, `$blue-bg-light`, `$blue-bg-lighter`
- Semantic: `$success`, `$error`, `$warning`, `$info`
- Others: `$yellow`, `$green`

**Transitions**:
- `$transition`: `all 0.3s ease` (default)
- `$transition-fast`: `all 0.15s ease`
- `$transition-slow`: `all 0.5s ease`

**Important**: Never add `all` before transition variables - they already include it:
```scss
// ✅ CORRECT
transition: $transition;

// ❌ WRONG
transition: all $transition;
```

**Why SCSS variables over CSS custom properties in components?**
- No need for interpolation `#{}`
- Better integration with mixins and functions
- Type checking in some SCSS processors
- CSS custom properties are reserved for global color system (in `_colors.scss`)

---

### 4. CSS Selectors
**NEVER use direct HTML tag selectors**. Always use classes:

```scss
// ❌ WRONG: Direct HTML tag selectors
.component {
  h3 {
    font-size: rem(24);
  }
  
  p {
    color: $neutral-darker;
  }
  
  ul {
    list-style: none;
    
    li {
      padding: rem(8);
    }
  }
  
  a {
    color: $primary;
  }
}

// ✅ CORRECT: Class-based selectors
.component {
  .component__title {
    font-size: rem(24);
  }
  
  .component__text {
    color: $neutral-darker;
  }
  
  .component__list {
    list-style: none;
    
    .component__list-item {
      padding: rem(8);
    }
  }
  
  .component__link {
    color: $primary;
  }
}
```

**Rationale**:
- **Avoids specificity issues**: No unexpected style overrides
- **Prevents unintended inheritance**: Styles don't leak to nested components
- **Maintainable and predictable**: Clear scope of styles
- **Component isolation**: Each component controls its own styles
- **Better refactoring**: Easy to move elements without breaking styles

**Exception**: Global typography in `_typography.scss` can use tag selectors for base styles.

---

## 🏗️ BEM Methodology

**Use BEM (Block Element Modifier) with `&__` and `&--` nesting**:

```scss
// ✅ CORRECT: BEM with & nesting
.card {
  padding: rem(24);
  background: $white;
  
  // Element: card__header
  &__header {
    margin-bottom: rem(16);
    
    // Nested element: card__title
    &__title {
      font-size: rem(20);
      color: $neutral-darkest;
    }
  }
  
  // Element: card__body
  &__body {
    color: $neutral-darker;
  }
  
  // Modifier: card--highlighted
  &--highlighted {
    background: $blue-bg-lighter;
    border: rem(2) solid $primary;
  }
  
  // Modifier: card--compact
  &--compact {
    padding: rem(16);
    
    // Modifier affects nested element
    .card__header {
      margin-bottom: rem(8);
    }
  }
}

// Generated CSS:
// .card { ... }
// .card__header { ... }
// .card__header__title { ... }
// .card__body { ... }
// .card--highlighted { ... }
// .card--compact { ... }
```

**BEM Structure**:
- **Block**: `.card` - Independent component
- **Element**: `.card__header` - Part of the block (use `&__`)
- **Modifier**: `.card--highlighted` - Variation of block or element (use `&--`)

**Benefits**:
- Clear component structure
- No specificity wars
- Easy to understand HTML/CSS relationship
- Scalable and maintainable

---

## 📐 File Structure Template

**Every SCSS file should follow this structure**:

```scss
/**
 * ComponentName Styles
 * 
 * Brief description of styling approach.
 * Mention key features like hover effects, animations, responsive behavior.
 */

@use 'globals' as *;

// ═══ MAIN CONTAINER ═══
.component {
  // Layout
  @include flex(center, center);
  
  // Sizing
  width: 100%;
  padding: rem(24);
  
  // Colors
  background: $white;
  color: $neutral-darker;
  
  // Effects
  transition: $transition;
  
  // ─── Header Section ───
  &__header {
    margin-bottom: rem(16);
    
    &__title {
      font-size: rem(24);
      font-weight: 600;
    }
  }
  
  // ─── Body Section ───
  &__body {
    font-size: rem(16);
    line-height: rem(24);
  }
  
  // ─── Footer Section ───
  &__footer {
    margin-top: rem(20);
    padding-top: rem(16);
    border-top: rem(1) solid $neutral-lighter;
  }
  
  // ─── Hover States ───
  &:hover {
    background: $neutral-bg;
    transform: translateY(rem(-2));
  }
  
  // ─── Modifiers ───
  &--large {
    padding: rem(32);
    
    .component__title {
      font-size: rem(28);
    }
  }
}

// ═══ RESPONSIVE DESIGN ═══

// Tablet and up (min-width: 768px)
@include media-min-breakpoint(md) {
  .component {
    padding: rem(32);
    
    &__header__title {
      font-size: rem(28);
    }
  }
}

// Desktop and up (min-width: 1024px)
@include media-min-breakpoint(lg) {
  .component {
    padding: rem(40);
    
    &__header__title {
      font-size: rem(32);
    }
  }
}

// ═══ ANIMATIONS ═══

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(rem(20));
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 📝 Comment Guidelines

### File Header
**Always include a documentation header**:

```scss
/**
 * ComponentName Styles
 * 
 * Detailed description of the component's styling approach.
 * Explain the purpose, key features, and any special behaviors.
 * Mention responsive strategy, animations, or complex interactions.
 */
```

### Section Markers
**Use visual section markers for organization**:

```scss
// ═══ MAJOR SECTION ═══  (double lines for main sections)
// ─── Subsection ───      (single lines for subsections)
```

**When to use**:
- `═══` for major logical sections (MAIN CONTAINER, RESPONSIVE DESIGN, ANIMATIONS)
- `───` for subsections within a block (Header, Body, Footer, Hover States)

### Inline Comments
**Comment non-obvious styling choices**:

```scss
.component {
  // Prevent text selection for better UX
  user-select: none;
  
  // Fixed positioning for sticky header
  position: sticky;
  top: 0;
  z-index: 100;
  
  // Custom scrollbar styling
  &::-webkit-scrollbar {
    width: rem(8);
  }
  
  // Hover effect with slight elevation
  &:hover {
    box-shadow: 0 rem(4) rem(12) rgba(0, 0, 0, 0.15);
  }
}
```

### Responsive Comments
**Label breakpoints with pixel values**:

```scss
// Tablet and up (min-width: 768px)
@include media-min-breakpoint(md) {
  // Explain responsive adjustments
  .component {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

// Desktop and up (min-width: 1024px)
@include media-min-breakpoint(lg) {
  // Explain desktop-specific changes
  .component {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 🎭 Color Usage

### SCSS Variables (Preferred)
**Use SCSS color variables in component styles**:

```scss
@use 'globals' as *;

.component {
  // ✅ CORRECT: SCSS variables
  color: $neutral-darker;
  background: $white;
  border-color: $neutral-lighter;
  
  &:hover {
    color: $primary;
    background: $blue-bg-lighter;
  }
}
```

### CSS Custom Properties
**CSS custom properties are defined globally and available everywhere**:

```scss
// These are already available without import (defined in _colors.scss)
.component {
  color: var(--neutral-darker);
  background: var(--white);
}
```

**When to use CSS custom properties**:
- Dynamic theming (not implemented yet)
- Runtime color changes
- Sharing colors with JavaScript

**For now, prefer SCSS variables in component files** for consistency and better tooling support.

---

## 🔧 Mixins and Functions

### Available Mixins

#### `flex()`
```scss
// Flexible flexbox setup
@include flex($justify, $align, $direction, $wrap, $display);

// Examples
@include flex(center, center); // justify-content: center, align-items: center
@include flex(space-between, flex-start); // justify-content: space-between, align-items: flex-start
@include flex(center, center, column); // flex-direction: column
```

#### `media-min-breakpoint()`
```scss
// Mobile-first media query
@include media-min-breakpoint($breakpoint) {
  // Styles for $breakpoint and up
}

// Available breakpoints: xs, sm, md, lg, xl, xxl
@include media-min-breakpoint(md) { /* tablet and up */ }
@include media-min-breakpoint(lg) { /* desktop and up */ }
```

#### `media-max-breakpoint()`
```scss
// Desktop-first media query (use sparingly)
@include media-max-breakpoint($breakpoint) {
  // Styles for $breakpoint and down
}

// Use only when you need to remove/simplify styles on smaller screens
@include media-max-breakpoint(sm) { /* mobile only */ }
```

#### `animated-underline()`
```scss
// Adds animated underline effect on hover
.link {
  @include animated-underline;
  
  &:hover::after {
    width: 100%; // Expands underline on hover
  }
}
```

### Available Functions

#### `rem()`
```scss
// Converts px to rem
width: rem(300);      // 300px / 16 = 18.75rem
padding: rem(16);     // 16px / 16 = 1rem
font-size: rem(14);   // 14px / 16 = 0.875rem
```

#### `vh()`
```scss
// Converts px to vh (based on 900px viewport height)
height: vh(450);      // 50vh
```

#### `vw()`
```scss
// Converts px to vw (default: 375px mobile width)
width: vw(187.5);     // 50vw
width: vw(640, 1280); // Custom base width
```

---

## 🎯 Responsive Breakpoints

### Defined Breakpoints
```scss
$grid-breakpoints: (
  xs: 0,       // Mobile (default)
  sm: 576px,   // Large mobile
  md: 768px,   // Tablet
  lg: 1024px,  // Desktop
  xl: 1280px,  // Large desktop
  xxl: 1536px  // Extra large desktop
);
```

### Usage Strategy
**Mobile-first approach** - Start with mobile styles, progressively enhance:

```scss
.component {
  // Mobile base (0-767px)
  font-size: rem(14);
  padding: rem(16);
  
  // Tablet and up (768px+)
  @include media-min-breakpoint(md) {
    font-size: rem(16);
    padding: rem(24);
  }
  
  // Desktop and up (1024px+)
  @include media-min-breakpoint(lg) {
    font-size: rem(18);
    padding: rem(32);
  }
  
  // Large desktop and up (1280px+)
  @include media-min-breakpoint(xl) {
    font-size: rem(20);
    padding: rem(40);
  }
}
```

---

## ⚠️ Common Pitfalls to Avoid

### ❌ Things NOT to Do

1. **Don't use px or rem literals**
   ```scss
   // ❌ WRONG
   padding: 16px;
   margin: 1.5rem;
   
   // ✅ CORRECT
   padding: rem(16);
   margin: rem(24);
   ```

2. **Don't use desktop-first approach**
   ```scss
   // ❌ WRONG
   .component {
     padding: rem(32); // Desktop base
     
     @include media-max-breakpoint(md) {
       padding: rem(16); // Mobile (overriding)
     }
   }
   
   // ✅ CORRECT
   .component {
     padding: rem(16); // Mobile base
     
     @include media-min-breakpoint(md) {
       padding: rem(32); // Desktop (enhancing)
     }
   }
   ```

3. **Don't add redundant 'all' to transitions**
   ```scss
   // ❌ WRONG
   transition: all $transition;
   
   // ✅ CORRECT
   transition: $transition;
   ```

4. **Don't use direct HTML tag selectors**
   ```scss
   // ❌ WRONG
   .component {
     h3 { font-size: rem(24); }
     p { color: $neutral; }
   }
   
   // ✅ CORRECT
   .component {
     &__title { font-size: rem(24); }
     &__text { color: $neutral; }
   }
   ```

5. **Don't use CSS custom properties for colors in components**
   ```scss
   // ❌ WRONG (unless you need dynamic theming)
   .component {
     color: var(--neutral-darker);
   }
   
   // ✅ CORRECT
   .component {
     color: $neutral-darker;
   }
   ```

6. **Don't forget `@use 'globals' as *;`**
   ```scss
   // ❌ WRONG
   .component {
     color: $primary; // Error: $primary is undefined
   }
   
   // ✅ CORRECT
   @use 'globals' as *;
   
   .component {
     color: $primary;
   }
   ```

7. **Don't nest selectors too deeply**
   ```scss
   // ❌ WRONG (too nested, hard to maintain)
   .component {
     .header {
       .title {
         .text {
           .link {
             color: $primary;
           }
         }
       }
     }
   }
   
   // ✅ CORRECT (flat BEM structure)
   .component {
     &__header { }
     &__title { }
     &__text { }
     &__link { color: $primary; }
   }
   ```

---

## ✅ Quick Checklist

Before committing SCSS code, verify:

- [ ] File has documentation header comment
- [ ] `@use 'globals' as *;` is present
- [ ] All sizes use `rem()` function (no px/rem literals)
- [ ] Mobile-first approach with `media-min-breakpoint()`
- [ ] SCSS variables used for colors and transitions
- [ ] No redundant `all` in transitions
- [ ] Class-based selectors (no direct HTML tag selectors)
- [ ] BEM methodology with `&__` and `&--`
- [ ] Major sections marked with `// ═══ SECTION ═══`
- [ ] Subsections marked with `// ─── Subsection ───`
- [ ] Responsive breakpoints commented with pixel values
- [ ] Non-obvious styling choices explained
- [ ] Hover/focus states defined where appropriate

---

## 🚀 Examples

### Complete Example
```scss
/**
 * Card Component Styles
 * 
 * A flexible card component with hover effects and responsive sizing.
 * Features include animated elevation on hover and adaptive padding.
 */

@use 'globals' as *;

// ═══ MAIN CONTAINER ═══
.card {
  // Layout
  @include flex(flex-start, stretch, column);
  
  // Sizing
  width: 100%;
  padding: rem(20);
  gap: rem(12);
  
  // Colors
  background: $white;
  border: rem(1) solid $neutral-lighter;
  border-radius: rem(12);
  
  // Effects
  transition: $transition;
  box-shadow: 0 rem(2) rem(4) rgba(0, 0, 0, 0.05);
  
  // ─── Header ───
  &__header {
    @include flex(space-between, center);
    padding-bottom: rem(12);
    border-bottom: rem(1) solid $neutral-lightest;
    
    &__title {
      font-size: rem(18);
      font-weight: 600;
      color: $neutral-darkest;
    }
    
    &__icon {
      width: rem(24);
      height: rem(24);
      color: $primary;
    }
  }
  
  // ─── Body ───
  &__body {
    flex-grow: 1;
    font-size: rem(14);
    line-height: rem(22);
    color: $neutral-darker;
  }
  
  // ─── Footer ───
  &__footer {
    padding-top: rem(12);
    border-top: rem(1) solid $neutral-lightest;
  }
  
  // ─── Hover State ───
  &:hover {
    transform: translateY(rem(-4));
    box-shadow: 0 rem(8) rem(16) rgba(0, 0, 0, 0.1);
    border-color: $primary-light;
  }
  
  // ─── Modifiers ───
  &--highlighted {
    background: $blue-bg-lighter;
    border-color: $primary;
  }
  
  &--compact {
    padding: rem(16);
    gap: rem(8);
  }
}

// ═══ RESPONSIVE DESIGN ═══

// Tablet and up (min-width: 768px)
@include media-min-breakpoint(md) {
  .card {
    padding: rem(24);
    gap: rem(16);
    
    &__header__title {
      font-size: rem(20);
    }
    
    &__body {
      font-size: rem(16);
      line-height: rem(24);
    }
  }
}

// Desktop and up (min-width: 1024px)
@include media-min-breakpoint(lg) {
  .card {
    padding: rem(32);
    
    &__header__title {
      font-size: rem(24);
    }
  }
}
```

---

**Remember**: Consistency is key. Following these conventions ensures maintainable, scalable, and accessible styles across the entire project.


## Angular Material 22: canonical design system

This section supersedes the older advice above about avoiding CSS custom properties for colors in migrated components.

### Sources of truth

- `src/styles/_theme.scss`: one light Material theme with current Inter/system typography and density 0.
- `src/styles/_theme-colors.scss`: palette generated from Showcase primary seed `#667eea`.
- `src/styles/_tokens.scss`: spacing steps `0, 1, 2, 3, 4, 6, 8, 10, 12, 16` map to `0, 4, 8, 12, 16, 24, 32, 40, 48, 64` px converted to rem; radii `sm`, `md`, `lg` are 8, 12, 16 px; shadows are `card` and `raised`.
- `src/styles/_globals.scss`: forwards the shared helpers, including `surface-panel($padding: 6)`.

### Public Material APIs only

Use native Material controls directly in templates: `matButton`, `matIconButton`, `mat-form-field`, `mat-label`, `matInput`, and `mat-error`. Keep business logic in the existing feature component and preserve Reactive Forms validation/reset semantics.

Create and customize the theme with `mat.theme`, `mat.theme-overrides`, and the documented component `*-overrides` mixins. Semantic colors and typography in custom components must consume public system tokens such as `--mat-sys-surface`, `--mat-sys-on-surface`, and `--mat-sys-body-large`. Pair each surface with its matching on-color.

Do not select private `.mat-mdc-*` classes, depend on Material's internal DOM, manually assign private component tokens, or use `::ng-deep` to customize Material. The existing CodeBlock syntax highlighting uses dynamically inserted HTML and is independent of Material.

`.showcase-danger` supplies error-colored Material actions through public overrides. `.showcase-field` is a layout class, not a field-skin override. Material focus styling is generated by the official strong-focus API; native controls retain their own visible focus ring.

### Migration and verification

Home, Forms, Signals and `/design-system` use this system. Legacy styles in other demos remain pending incremental migration. Preserve the gradient page background and the custom educational components.

Use class-based selectors and mobile-first layouts. Verify 360/768/1440 px layouts, keyboard access, contrast, disabled/error states, and no page-wide horizontal overflow. Do not increase build budgets to accommodate duplicate styles. Update the live catalog when changing tokens or supported component variants.

Official documentation: https://material.angular.dev/guide/theming
