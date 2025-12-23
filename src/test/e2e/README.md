# E2E Test Suite

This directory contains end-to-end integration tests for the dealer portal application.

## Test Files

1. **`dealerOnboarding.e2e.test.jsx`** - Tests dealer creation wizard flow
2. **`userOnboarding.e2e.test.jsx`** - Tests user creation with role-based assignments
3. **`orderFlow.e2e.test.jsx`** - Tests order creation, submission, and approval workflows
4. **`invoicePaymentFlow.e2e.test.jsx`** - Tests invoice creation from orders and payment workflows
5. **`dashboardNotifications.e2e.test.jsx`** - Tests dashboard loading and notification system
6. **`roleBasedNavigation.e2e.test.jsx`** - Tests role-based routing and access control

## Running Tests

```bash
# Run all E2E tests
npm test -- src/test/e2e --run

# Run a specific test file
npm test -- src/test/e2e/orderFlow.e2e.test.jsx --run

# Run in watch mode
npm test -- src/test/e2e
```

## Test Status

**Current Status:** 15 passing, 13 failing (28 total)

### Passing Tests ✅
- Role-based navigation (7 tests)
- Dashboard loading (4 tests)
- Tasks and notifications (4 tests)

### Tests Needing Attention ⚠️

1. **Dealer Onboarding** - Material-UI Select interactions need refinement
2. **User Onboarding** - Form step navigation and field interactions
3. **Order Flow** - Material selection dropdown interaction
4. **Invoice/Payment Flow** - Form field selectors and interactions

## Common Issues & Solutions

### Material-UI Select Components
Material-UI Select components render in portals and require special handling:
```javascript
// Click to open
await user.click(selectElement);

// Wait for menu to appear
await waitFor(() => {
  const option = screen.getByRole('option', { name: /Option Name/i });
  expect(option).toBeInTheDocument();
});

// Click the option
await user.click(option);
```

### Native Select Elements
For native `<select>` elements, use `selectOptions`:
```javascript
await user.selectOptions(selectElement, 'value');
```

### import.meta.env
The test setup mocks `import.meta.env` globally. If you see errors about `VITE_API_URL`, check that the mock is properly set up in `src/test/setup.js`.

## Test Utilities

- **`renderWithProviders`** - Renders components with all necessary providers (Auth, Router, etc.)
- **`setMockUser`** - Updates the mock user for role-based testing
- **`createApiMocks`** - Creates comprehensive API mocks for all services

## Writing New Tests

1. Import test utilities:
```javascript
import { renderWithProviders, setMockUser } from '../utils/testUtils';
```

2. Mock required APIs:
```javascript
vi.mock('../../services/api', () => {
  const { createApiMocks } = require('../utils/apiMocks');
  return createApiMocks();
});
```

3. Set up user context:
```javascript
beforeEach(() => {
  setMockUser({
    id: 'user-1',
    role: 'dealer_admin',
    dealerId: 'dealer-1',
  });
});
```

4. Render and test:
```javascript
it('should perform action', async () => {
  renderWithProviders(<Component />, { route: '/path' });
  
  await waitFor(() => {
    expect(screen.getByText(/Expected Text/i)).toBeInTheDocument();
  });
  
  // Perform interactions
  await user.click(button);
  
  // Verify results
  expect(apiMethod).toHaveBeenCalled();
});
```

## Notes

- Tests use mocked API responses - they don't hit real backend
- All tests run in jsdom environment (no real browser)
- Socket connections are mocked
- File uploads are simulated with FileReader mocks

