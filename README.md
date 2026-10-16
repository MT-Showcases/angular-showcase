# Angular Showcase 🚀

> **A modern, interactive learning platform for Angular and beyond**

Angular Showcase is an open-source platform that transforms technical documentation and software development learning into a fully immersive, modular, and "variable-depth" experience. 

**No infinite scrolling. No external redirects. Just pure, progressive exploration.**

---

## 🎯 Project Philosophy

Traditional documentation follows a linear path: you scroll, read, and maybe click a link that takes you somewhere else. You lose context. You lose focus.

**We believe learning should be different.**

Angular Showcase is built on the principle of **progressive disclosure**: every concept can be opened, deepened, deconstructed, and recombined—all without ever leaving the site. Each click reveals a new layer of understanding, like peeling back the layers of an onion.

### Core Principles

- **Immersive Learning**: Stay in the flow. No external links, no context switching.
- **Depth on Demand**: Start simple, go deep when you're ready—all in a few clicks.
- **Curiosity-Driven Navigation**: Explore topics through cards, modals, side panels, and inline expansions.
- **Hands-On Experimentation**: Sandbox environments for live code testing, right in the page.
- **Community-Powered**: Open source, built for students and developers, by students and developers.

---

## 🌟 How It Works

### Progressive Depth Architecture

Instead of throwing everything at you at once, Angular Showcase organizes information in **conceptual layers**:

1. **Overview Cards**: High-level concepts with icons and brief descriptions
2. **Expandable Modals**: Click to open detailed explanations, code examples, and visualizations
3. **Side Panels**: Related topics, additional context, or alternative explanations
4. **Inline Expansions**: Definitions, comparisons, and quick references without leaving your spot
5. **Sandbox Environments**: Live code editors to test concepts immediately

### Internal Navigation System

Every link, every reference, every related concept opens **within the platform**:
- Click "Data Binding" → Modal opens with explanation and demo
- Click "Learn more about Signals" → Side panel slides in with deeper content
- Click "Try it yourself" → Inline sandbox appears for experimentation

**You never leave. You just go deeper.**

---

## 🛠️ Technologies

Built with modern web technologies:

- **[Angular 22](https://angular.dev/)** - Standalone components, Signals API, Control Flow
- **TypeScript** - Type-safe, maintainable code
- **SCSS** - Modular styling with global design system
- **RxJS** - Reactive state management
- **NgRx** - Advanced state management patterns

---

## 🚀 Getting Started

### Prerequisites

- Node.js **24.22.0 LTS**, selected per project through `.nvmrc` (Node 22.22.3+ and 26.x are also compatible).
- npm **12.2.0**, declared in `packageManager`. Bootstrap with `npx --yes npm@12.2.0 ci` if the selected Node installation bundles an older npm.
- Runtime changes are scoped to this project; no global Node/npm replacement is required.
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Flame0510/angular-showcase.git

# Navigate to project directory
cd angular-showcase

# Install locked dependencies with the declared package manager
npx --yes npm@12.2.0 ci

# Start development server
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser. The application will automatically reload when you modify source files.

### Build for Production

```bash
npm run build
```

Build artifacts will be stored in the `dist/` directory.

---

## Design System

The `/design-system` route is the internal catalog, also linked under **Esempi** in the navigation.
It demonstrates the actual theme, spacing, typography, reusable cards, Material controls, and their
error/disabled states, with copyable examples.

- `src/styles/`: the generated brand palette, Material theme, public component overrides, and layout tokens.
- `src/app/components/`: reusable educational components such as FeatureCard, ConceptCard, GuideStep, and CodeBlock.
- `src/app/design-system/`: the lazy-loaded catalog.
- Home, Forms, and Signals use the shared theme. Other demos retain their existing styles for a later migration.

Standard controls use Angular Material **22.2.3** directly. Customization uses `mat.theme`,
`mat.theme-overrides`, component `*-overrides` mixins, and public `--mat-sys-*` tokens.
Do not style Material private DOM classes or use `::ng-deep` to customize Material.
See [the official theming guide](https://material.angular.dev/guide/theming) and
[local styling conventions](.github/copilot-instructions/styling-conventions.md).

### Runtime and verification

The Angular 22 upgrade uses official Angular and NgRx migrations. Existing components explicitly retain
`ChangeDetectionStrategy.Eager` to preserve demo behavior. Templates use built-in `@if`/`@for` control
flow; legacy directive syntax is labelled as historical context. Reactive Forms, Signals,
BehaviorSubject, and NgRx remain separate teaching examples.

TypeScript stays on **6.0.x**, the line supported by Angular 22; newer incompatible majors are excluded.
Vitest 5 and jsdom 30 run the component and routed interaction tests. Run `npm test -- --watch=false`,
`npm run build`, and `npm audit`. The build budgets remain 500 kB for the initial bundle and 10 kB per
component stylesheet (warning thresholds); existing NgRx/BehaviorSubject style warnings are tracked
separately from functional failures.

npm 12 uses version-pinned `allowScripts` entries for the native build dependencies. Review this
allowlist when upgrading those packages instead of disabling the install-script policy globally.

---

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Here's how you can help:

### Ways to Contribute

- 🐛 **Report Bugs**: Open an issue with detailed reproduction steps
- 💡 **Suggest Features**: Share your ideas for new interactive learning experiences
- 📖 **Improve Documentation**: Help make concepts clearer and more accessible
- 🎨 **Design Enhancements**: Improve UI/UX for better learning experiences
- 💻 **Code Contributions**: Submit PRs for new features or bug fixes

### Contribution Guidelines

1. **Fork the repository** and create a new branch for your feature
2. **Read the documentation** before contributing (see below)
3. **Write meaningful commit messages** in English
4. **Test your changes** thoroughly before submitting
5. **Submit a Pull Request** with a clear description of your changes

### Required Reading for Contributors

Please review these documents before contributing:

- [📘 **Copilot Instructions**](./.github/copilot-instructions.md) - Project overview and architecture
- [📐 **Project Structure**](./.github/copilot-instructions/project-structure.md) - Directory organization and file naming
- [🎨 **Styling Conventions**](./.github/copilot-instructions/styling-conventions.md) - SCSS best practices (mobile-first, BEM, rem())
- [🧩 **Reusable Components**](./.github/copilot-instructions/reusable-components.md) - Component documentation standards

### Quick Coding Standards

- ✅ All code, comments, and documentation **must be in English**
- ✅ Use standalone Angular components (no NgModule)
- ✅ Follow TypeScript best practices with explicit types
- ✅ Use `@use 'globals' as *;` in SCSS files
- ✅ Mobile-first approach with `@include media-min-breakpoint()`
- ✅ Use `rem()` function for all sizes (no px/rem literals)
- ✅ BEM methodology with `&__` and `&--` syntax
- ✅ Class-based selectors only (never direct HTML tag selectors)

---

## 🗺️ Roadmap

> **📌 Note**: This roadmap is actively maintained. When completing items, update checkboxes and move completed phases to "Recently Completed" section.

Our vision unfolds in phases:

### Phase 1: MVP Foundation ✅
- [x] Angular core concepts showcase
- [x] Interactive demos for Signals, HTTP, Forms
- [x] State management examples (NgRx, BehaviorSubject)
- [x] Responsive design system with mobile-first approach
- [x] Modal-based deep-dive architecture
- [x] Complete technical documentation system
- [x] SCSS architecture with BEM methodology and rem() system
- [x] Reusable component library with standardized documentation

### Phase 2: Progressive Depth (In Progress - Q1 2026)
- [x] Comprehensive documentation structure (Styling, Components, Project Structure)
- [x] AI-assisted development approach and commenting standards
- [x] File-level headers and pattern comments applied to all components (30+ files)
- [ ] Expandable concept cards with multiple depth levels
- [ ] Side panel system for related topics
- [ ] Internal hyperlink network (zero external redirects)
- [ ] Breadcrumb navigation for context retention
- [ ] Search with instant preview modals
- [ ] TypeScript conventions documentation

### Phase 3: Interactive Sandboxes (Q2 2026)
- [ ] Live code editor integration
- [ ] Real-time TypeScript compilation
- [ ] Inline component preview
- [ ] Share and save code snippets
- [ ] Compare implementations side-by-side

### Phase 4: AI Integration (Q3 2026)
- [ ] AI-generated explanations at different complexity levels
- [ ] Code refactoring suggestions
- [ ] Framework comparison tool (Angular vs React vs Vue)
- [ ] Personalized learning paths based on user interaction
- [ ] Natural language code generation from concept descriptions

### Phase 5: Multi-Framework Expansion (Q4 2026)
- [ ] React showcase with same progressive depth approach
- [ ] Vue showcase
- [ ] Svelte showcase
- [ ] Cross-framework concept mapping
- [ ] Unified learning experience across technologies

---

## 🎓 Vision & Long-Term Goals

### Education Reimagined

We envision Angular Showcase as the **future of technical education**:

- **No More Tab Chaos**: Everything you need in one place, organized by your curiosity
- **Learn Your Way**: Choose your depth level—from "just show me the basics" to "I need to understand every detail"
- **Community-Driven**: Built by learners, for learners, with contributions from developers worldwide
- **AI-Augmented**: Smart assistance that adapts to your learning style and pace
- **Framework-Agnostic**: Apply the same learning approach to any technology

### Open Source First

This platform is built for the community:

- **Transparent Development**: All decisions, discussions, and code are open
- **Welcoming to All**: Beginners and experts alike can contribute
- **Educational Focus**: Prioritize learning outcomes over commercial interests
- **Innovation Lab**: Experiment with new ways to teach and learn programming

### Measurable Impact

Success for us means:

- Developers learning faster and more deeply
- Reduced frustration with technical documentation
- More contributors joining and improving the platform
- Students building real projects with confidence
- A global community of curious, empowered learners

---

## 🤖 AI-Assisted Development

This project is intentionally **AI-assistant friendly** while remaining fully human-readable and maintainable.

### Why AI-Assisted?

The codebase is structured and commented so that tools like **GitHub Copilot** or **ChatGPT** can:
- ✅ Recognize recurring patterns (container/presentational, facades, store patterns, etc.)
- ✅ Generate new examples and sections consistent with existing architecture
- ✅ Maintain highly consistent comments and documentation across similar files
- ✅ Speed up repetitive tasks while preserving code quality

### AI-Friendly ≠ AI-Only

**This is still idiomatic, clean Angular code:**
- 👥 Fully readable and editable by humans
- 📖 Comments focus on *role* and *responsibilities*, not trivial details
- 🏗️ Patterns are clearly labeled (e.g., "PATTERN: Facade service")
- ✨ Follows modern Angular best practices (standalone components, Signals, etc.)

### Comment Standards

**File-level headers** describe component type, section, role, patterns, and contributor notes:
```typescript
// COMPONENT TYPE: Container | Presentational | Shared UI
// SECTION: High-level area (e.g., "Angular Signals", "HTTP")
//
// ROLE:
// - What this file is responsible for
//
// PATTERNS USED:
// - Container/Presentational split
// - Signals for local UI state
//
// NOTES FOR CONTRIBUTORS:
// - Guidelines for future modifications
```

**Pattern comments** label recurring architectural patterns:
```typescript
// PATTERN: Facade service
// PURPOSE:
// - Expose simplified API to components
// - Hide implementation details
```

**Micro-comments** only where truly needed (non-obvious decisions, trade-offs, educational simplifications).

For complete commenting standards, see [Copilot Instructions](./.github/copilot-instructions.md).

### Working With or Without AI

- ✅ **With AI tools**: Speed up repetitive tasks, maintain consistency
- ✅ **Without AI tools**: Code is fully understandable and maintainable
- 🎯 **Best of both worlds**: Human-first architecture + AI-assisted efficiency

---

## 📚 Technical Documentation

Complete technical documentation for developers is available in the `.github/copilot-instructions/` folder:

### Core Documentation
- [📘 **Copilot Instructions**](./.github/copilot-instructions.md) - Complete project overview, architecture, and conventions
- [📐 **Project Structure**](./.github/copilot-instructions/project-structure.md) - Directory organization, file naming, and path aliases
- [🎨 **Styling Conventions**](./.github/copilot-instructions/styling-conventions.md) - SCSS best practices, mobile-first approach, BEM methodology
- [💬 **Commenting Standards**](./.github/copilot-instructions/commenting-standards.md) - File headers, pattern comments, AI-assisted conventions
- [🧩 **Reusable Components**](./.github/copilot-instructions/reusable-components.md) - Component documentation standards and guidelines

### Quick Reference

**Project Structure**:
```
src/
  app/
    components/          # Reusable components
    [feature]/          # Feature components (one per route)
    store/              # NgRx store
  services/             # Shared services
  styles/               # Global SCSS with _globals.scss
  types/                # TypeScript interfaces
```

**Adding a New Component**:
1. Create folder: `src/app/[feature]/component-name/`
2. Create files: `.ts`, `.html`, `.scss`, `.spec.ts`
3. Use path aliases: `@components/*`, `@services/*`, `@models/*`
4. Follow [Styling Conventions](./.github/copilot-instructions/styling-conventions.md)

**SCSS Quick Tips**:
```scss
@use 'globals' as *;

.component {
  padding: rem(16); // Mobile base
  background: $white;
  transition: $transition; // Already includes 'all'
  
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

**Key Principles**:
- ✅ Mobile-first with `@include media-min-breakpoint()`
- ✅ Use `rem()` function for all sizes
- ✅ BEM methodology with `&__` for elements, `&--` for modifiers
- ✅ SCSS variables (not CSS custom properties in components)
- ✅ Class-based selectors only

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with ❤️ by developers who believe learning should be an adventure, not a chore.

Special thanks to:
- The Angular team for creating an amazing framework
- The open-source community for inspiration and support
- Every contributor who helps make this platform better

---

## 📬 Contact & Community

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: Share ideas and ask questions

**Let's make learning interactive, immersive, and inspiring—together.**

---

<p align="center">
  <strong>⭐ Star this repo if you believe in a better way to learn!</strong>
</p>

---

## 📚 Additional Resources

This project uses [Angular CLI](https://github.com/angular/angular-cli) version 22.2.2.

For more information on using the Angular CLI, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
