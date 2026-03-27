# Testing Guide

## Overview

This project uses a comprehensive testing setup with:
- **Vitest** - Unit and integration tests
- **React Testing Library** - Component testing
- **Playwright** - End-to-end (E2E) testing

## Test Structure

```
src/test/
├── setup.ts              # Global test configuration
├── unit/                 # Unit and integration tests
│   ├── services/         # Business logic tests
│   ├── repositories/     # Data layer tests
│   ├── schemas/          # Validation schema tests
│   ├── stores/           # State management tests
│   └── libraries/        # Third-party library tests
└── e2e/                  # End-to-end tests
    └── example.spec.ts   # E2E test examples
```

## Running Tests

### Unit Tests

```bash
# Run all tests in watch mode
npm test

# Run all tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests for a specific file
npm run test:run -- path/to/test.test.ts

# Run tests matching a pattern
npm run test:run -- --grep "FinancialCalculator"
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npx playwright test --headed

# Run E2E tests in debug mode
npx playwright test --debug

# Run specific E2E test
npx playwright test example.spec.ts
```

## Test Results

- **185 unit tests** currently passing
- Coverage includes services, repositories, schemas, stores, and libraries
- E2E tests validate critical user flows

## Writing Tests

### Unit Tests

Place in `src/test/unit/` matching the source structure:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateIRR } from '@/services/FinancialCalculator';

describe('FinancialCalculator', () => {
  it('should calculate IRR correctly', () => {
    const cashFlows = [-1000, 100, 200, 300];
    const irr = calculateIRR(cashFlows);
    expect(irr).toBeCloseTo(0.05, 2);
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { CalculatorForm } from '@/components/CalculatorForm';

describe('CalculatorForm', () => {
  it('should render investment input', () => {
    render(<CalculatorForm />);
    expect(screen.getByLabelText(/investment/i)).toBeInTheDocument();
  });
});
```

### E2E Tests

Place in `src/test/e2e/`:

```typescript
import { test, expect } from '@playwright/test';

test('user creates a new project', async ({ page }) => {
  await page.goto('/');

  await page.click('text=New Project');
  await page.fill('[name="projectName"]', 'Test Project');
  await page.click('button:has-text("Create")');

  await expect(page.locator('h1')).toContainText('Test Project');
});
```

## Configuration

### Vitest Configuration

Configured in `vite.config.ts`:
- Environment: jsdom
- Setup file: `src/test/setup.ts`
- Coverage: v8 provider with text, JSON, and HTML reporters
- Glob: `src/**/*.{test,spec}.{js,ts,jsx,tsx}`

### Playwright Configuration

Configured in `playwright.config.ts`:
- Test directory: `src/test/e2e`
- Base URL: `http://localhost:5173`
- Browser: Chromium
- Auto-starts dev server

## Best Practices

1. **Test Structure**
   - Arrange-Act-Assert pattern
   - Descriptive test names that explain the "what" and "why"
   - One assertion per test when possible

2. **Test Data**
   - Use fixtures for reusable test data
   - Mock external dependencies (APIs, databases)
   - Test edge cases and error conditions

3. **Component Testing**
   - Test user behavior, not implementation details
   - Use `screen` queries over `container` queries
   - Avoid testing CSS/styling

4. **E2E Testing**
   - Focus on critical user flows
   - Keep tests isolated and independent
   - Use data-testid selectors when necessary

## Coverage Goals

From TODOS.md:
- [ ] 100% coverage for financial calculation paths (IRR, NPV, cash flow)
- [ ] 100% coverage for benchmarking logic
- [ ] E2E tests for critical flows (onboarding, recalculation, sharing)

## Troubleshooting

### Tests fail to run
- Ensure all dependencies are installed: `npm install`
- Check that Node.js version is compatible (v18+)

### Playwright tests fail
- Install browsers: `npx playwright install`
- Ensure dev server is running or configure `webServer` in playwright.config.ts

### Coverage not generating
- Install @vitest/coverage-v8: `npm install -D @vitest/coverage-v8`
- Check coverage configuration in vite.config.ts

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
