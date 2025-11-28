# Spec Implementation Guidelines

## Checkpoint Tasks

When implementing checkpoint tasks (tasks that verify "all tests pass"), you MUST run a comprehensive validation suite to ensure code quality and correctness.

### Required Checks at Every Checkpoint

Run the following commands in order:

1. **Tests**: `npm test -- <relevant-test-files> --run`
   - Run all tests related to the current feature
   - Verify all tests pass (unit tests and property-based tests)
   - Check for any warnings or errors in test output

2. **Lint**: `npm run lint`
   - Ensure code follows ESLint rules
   - Must pass with zero warnings

3. **Format**: `npm run format` (if format:check fails)
   - Auto-fix any formatting issues with Prettier
   - Verify all files are properly formatted

4. **Type Check**: `npm run typecheck`
   - Ensure TypeScript compilation succeeds
   - Verify no type errors across the project

5. **Build**: `npm run build`
   - Verify all packages build successfully
   - Ensure no build errors or warnings

### Checkpoint Task Format

Checkpoint tasks should follow this pattern:

```markdown
- [ ] X. Checkpoint - Ensure [component] tests pass
  - Ensure all tests pass, ask the user if questions arise.
```

### Failure Handling

If any check fails:

1. **Tests**: Fix failing tests or investigate test issues
2. **Lint**: Run `npm run lint:fix` to auto-fix, then address remaining issues
3. **Format**: Run `npm run format` to auto-fix all formatting
4. **Type Check**: Address type errors in the code
5. **Build**: Fix build errors or configuration issues

Only mark the checkpoint as complete when ALL checks pass.

### Why Comprehensive Checks Matter

- **Tests**: Verify functional correctness
- **Lint**: Maintain code quality and consistency
- **Format**: Ensure readable, consistent code style
- **Type Check**: Catch type-related bugs early
- **Build**: Verify the code can be packaged and deployed

Running all checks at checkpoints prevents issues from accumulating and ensures the codebase remains in a healthy state throughout development.
