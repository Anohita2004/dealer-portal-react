# Testing Guide - Dealer Portal React

## 🧪 Test Setup

This project uses **Vitest** and **React Testing Library** for testing.

## 📦 Installation

Tests are already configured. To run tests:

```bash
# Install dependencies (if not already done)
npm install

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## 🎯 Test Structure

```
src/
├── test/
│   ├── setup.js              # Test configuration
│   ├── utils/
│   │   └── testUtils.jsx     # Test utilities and helpers
│   ├── components/           # Component tests
│   ├── pages/                # Page tests
│   │   └── superadmin/       # SuperAdmin page tests
│   └── services/             # API service tests
```

## ✅ Test Coverage Areas

### 1. **Authentication & Authorization**
- [x] Login flow
- [x] Protected routes
- [x] Role-based access
- [ ] OTP verification
- [ ] Token refresh

### 2. **SuperAdmin Functionality**
- [x] User management (CRUD)
- [ ] Team management
- [ ] Campaign creation
- [ ] Order viewing
- [ ] Invoice management
- [ ] Payment tracking
- [ ] Dealer management
- [ ] User activity logs

### 3. **Components**
- [x] ProtectedRoute
- [ ] ApprovalWorkflow
- [ ] CampaignForm
- [ ] CampaignTargeting
- [ ] ScopedDataTable
- [ ] TaskList

### 4. **API Services**
- [x] User API
- [ ] Campaign API
- [ ] Order API
- [ ] Payment API
- [ ] Invoice API

### 5. **Pages**
- [x] Users page
- [ ] AllOrders page
- [ ] AllInvoices page
- [ ] AllPayments page
- [ ] AllDealers page
- [ ] UserActivity page
- [ ] TeamManagement page
- [ ] RegionWiseReports page

## 🚀 Running Tests

### Watch Mode (Development)
```bash
npm test
```
Runs tests in watch mode - re-runs on file changes.

### UI Mode (Interactive)
```bash
npm run test:ui
```
Opens Vitest UI in browser for interactive testing.

### Coverage Report
```bash
npm run test:coverage
```
Generates coverage report showing which code is tested.

## 📝 Writing Tests

### Example: Component Test

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '../utils/testUtils';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Example: API Test

```javascript
import { describe, it, expect, vi } from 'vitest';
import { userAPI } from '../../services/api';

describe('userAPI', () => {
  it('should fetch users', async () => {
    const users = await userAPI.getUsers();
    expect(Array.isArray(users)).toBe(true);
  });
});
```

## 🎯 Key Functionalities to Test

### SuperAdmin Features

1. **User Management**
   - ✅ Create user with all fields
   - ✅ Edit user
   - ✅ Delete user
   - ✅ Bulk actions
   - ✅ Filter by role/status
   - ✅ Export users

2. **Campaign Management**
   - Create campaign
   - Target specific dealers/regions
   - Product selection
   - Campaign analytics

3. **Order Management**
   - View all orders
   - Filter by status/region
   - Search orders
   - Export orders

4. **Invoice Management**
   - View all invoices
   - Payment tracking
   - Status management

5. **Payment Management**
   - View all payments
   - Reconciliation
   - Approval workflows

6. **Dealer Management**
   - View all dealers
   - Performance metrics
   - Detailed views

7. **Team Management**
   - Create teams
   - Add managers/dealers
   - View performance

8. **Reports**
   - Region-wise reports
   - Performance analytics
   - Export reports

## 🔍 Manual Testing Checklist

While automated tests are being written, you can manually test:

### SuperAdmin Dashboard
- [ ] All KPIs display correctly
- [ ] Charts render properly
- [ ] Real-time updates work

### User Management
- [ ] Create user with all role types
- [ ] Assign region/area/territory/dealer
- [ ] Assign manager
- [ ] Assign to sales team
- [ ] Edit user
- [ ] Delete user
- [ ] Bulk activate/deactivate
- [ ] Export users

### Campaign Management
- [ ] Create campaign
- [ ] Select products
- [ ] Target dealers/regions/teams
- [ ] View analytics
- [ ] Edit campaign
- [ ] Delete campaign

### Orders/Invoices/Payments
- [ ] View all items
- [ ] Filter by status/region
- [ ] Search functionality
- [ ] Export data
- [ ] View details

### Team Management
- [ ] Create team
- [ ] Add managers
- [ ] Add dealers
- [ ] View performance
- [ ] Edit/delete team

### Reports
- [ ] Region-wise reports
- [ ] Performance metrics
- [ ] Export reports
- [ ] Interactive charts

## 🐛 Debugging Tests

If tests fail:

1. Check console for errors
2. Verify API endpoints are correct
3. Check mock data matches expected format
4. Ensure all dependencies are installed
5. Run `npm test -- --reporter=verbose` for detailed output

## 📊 Coverage Goals

- **Components**: 80%+
- **Pages**: 70%+
- **Services**: 90%+
- **Utils**: 100%

## 🎉 Next Steps

1. Add more component tests
2. Add integration tests
3. Add E2E tests (optional - with Playwright/Cypress)
4. Set up CI/CD with test automation

