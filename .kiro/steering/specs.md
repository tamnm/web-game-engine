---
inclusion: always
---

# Spec Implementation Guidelines

## Checkpoint Validation Protocol

When implementing checkpoint tasks (tasks that verify "all tests pass"), you MUST execute a comprehensive validation suite to ensure code quality and correctness. This is non-negotiable for maintaining codebase health.

### Mandatory Validation Sequence

Execute these commands in the exact order specified:

1. **Test Validation**: `npm test -- <relevant-test-files> --run`
   - Target specific test files related to current feature
   - Verify all tests pass (unit, integration, property-based)
   - Check for warnings, deprecations, or error messages in output
   - Use `--run` flag to prevent watch mode blocking

2. **Lint Validation**: `npm run lint`
   - Enforce ESLint rules across all TypeScript files
   - Zero warnings policy - all issues must be resolved
   - Use `npm run lint:fix` for auto-fixable issues first

3. **Format Validation**: `npm run format:check` → `npm run format` (if needed)
   - Ensure Prettier formatting consistency
   - Auto-fix all formatting issues when check fails
   - Verify consistent code style across project

4. **Type Validation**: `npm run typecheck`
   - Confirm TypeScript compilation success
   - Resolve all type errors before proceeding
   - Ensure strict mode compliance

5. **Build Validation**: `npm run build`
   - Verify successful compilation of all packages
   - Check for build warnings or errors
   - Confirm distributable artifacts are generated

### Checkpoint Task Implementation

Structure checkpoint tasks using this exact format:

```markdown
- [ ] X. Checkpoint - Ensure [component] tests pass
  - Run complete validation suite (test, lint, format, typecheck, build)
  - All checks must pass with zero errors/warnings
  - Ask user for guidance if validation failures occur
```

### Failure Resolution Strategy

When validation fails, follow this systematic approach:

1. **Test Failures**:
   - Analyze failing test output for root cause
   - Fix implementation bugs or update test expectations
   - Never skip or disable failing tests without user approval

2. **Lint Failures**:
   - Run `npm run lint:fix` for auto-fixable issues
   - Manually resolve remaining violations
   - Follow project's ESLint configuration strictly

3. **Format Failures**:
   - Run `npm run format` to auto-fix all formatting
   - Verify changes align with Prettier configuration

4. **Type Failures**:
   - Address TypeScript errors in source code
   - Maintain strict type safety standards
   - Use proper type annotations and interfaces

5. **Build Failures**:
   - Resolve compilation errors in source files
   - Fix configuration issues in build tools
   - Ensure all dependencies are properly resolved

### Quality Assurance Principles

- **Zero Tolerance**: No checkpoint passes with failing validations
- **Comprehensive Coverage**: All validation steps are mandatory
- **Early Detection**: Catch issues before they compound
- **Consistent Standards**: Maintain uniform code quality
- **User Communication**: Report validation failures clearly

### Spec Development Workflow

When working with specs:

1. **Requirements Phase**: Understand functional and technical requirements
2. **Design Phase**: Plan architecture and implementation approach
3. **Implementation Phase**: Write code following established patterns
4. **Validation Phase**: Execute checkpoint validation suite
5. **Iteration Phase**: Refine based on validation feedback

Only proceed to the next phase when current phase validation passes completely.
