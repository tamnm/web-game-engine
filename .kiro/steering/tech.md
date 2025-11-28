# Tech Stack

## Core Technologies

- **Language**: TypeScript 5.5+ with strict mode enabled
- **Runtime**: Node.js >= 20
- **Module System**: ESM (ES Modules)
- **Build Tools**:
  - tsup for library bundling
  - Vite for game builds and dev server
  - TypeScript project references for monorepo

## Development Tools

- **Linting**: ESLint (flat config) with TypeScript plugin
- **Formatting**: Prettier
- **Testing**: Vitest with jsdom
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions

## TypeScript Configuration

- Target: ES2022
- Module: ESNext
- Strict mode with additional checks:
  - `noImplicitOverride`
  - `noUnusedLocals`
  - `noUnusedParameters`
  - `noFallthroughCasesInSwitch`
  - `useUnknownInCatchVariables`

## Common Commands

### Installation

```bash
npm install
```

### Development

```bash
npm run lint              # Run ESLint
npm run lint:fix          # Auto-fix lint issues
npm run format            # Format with Prettier
npm run format:check      # Check formatting
npm run typecheck         # TypeScript type checking
```

### Testing

```bash
npm run test              # Run tests once
npm run test:watch        # Run tests in watch mode
```

### Building

```bash
npm run build             # Build all workspaces
npm run build:pages       # Build demo bundles for GitHub Pages
npm run clean             # Remove build artifacts
```

### Documentation

```bash
npm run docs:serve        # Serve docs site (dev)
npm run docs:preview      # Preview built docs
npm run docs:api          # Generate API reference
```

## Code Quality Rules

- Console usage: Only `console.warn`, `console.error`, and `console.info` allowed (no `console.log`)
- All code must pass ESLint with zero warnings
- Prettier formatting enforced via pre-commit hooks
- Tests required for engine core features
