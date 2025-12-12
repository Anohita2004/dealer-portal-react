# Dashboard API Endpoints Reference

This document lists all API endpoints used by each dashboard, as per the API_DOCUMENTATION.md.

## Super Admin Dashboard
**Main Endpoint:** `GET /api/reports/dashboard/super`
- Returns: Global KPIs, region breakdown, active campaigns, pending approvals
- Additional Endpoints:
  - `GET /api/admin/reports/kpi-summary` - Legacy KPI data
  - `GET /api/admin/reports/monthly-growth` - User growth data
  - `GET /api/admin/reports/role-distribution` - Role distribution
  - `GET /api/reports/regional-sales-summary` - Region comparison data
  - `GET /api/maps/heatmap?granularity=region` - Heatmap data

## Regional Admin Dashboard
**Main Endpoint:** `GET /api/reports/dashboard/regional`
- Returns: Region-scoped summary (dealers, sales, outstanding, approvals)
- Additional Endpoints:
  - `GET /api/dealers` - Top dealers in region
  - `GET /api/reports/territory` - Territory performance
  - `GET /api/reports/regional-sales-summary` - Sales trend data

## Regional Manager Dashboard
**Main Endpoint:** `GET /api/reports/dashboard/manager`
- Returns: Manager-scoped summary (dealers, approvals, sales)
- Additional Endpoints:
  - `GET /api/managers/approval-queue` - Pending approvals
  - `GET /api/managers/dealers` - Assigned dealers
  - `GET /api/reports/territory` - Area/territory rankings

## Area Manager Dashboard
**Main Endpoint:** `GET /api/areas/dashboard/summary`
- Returns: Area-scoped summary
- Additional Endpoints:
  - `GET /api/areas/dashboard/dealers` - Dealers in area
  - `GET /api/areas/dashboard/approvals` - Pending approvals
  - `GET /api/reports/territory` - Territory performance
  - `GET /api/reports/dealer-performance` - Sales trend

## Territory Manager Dashboard
**Main Endpoint:** `GET /api/reports/dashboard/manager`
- Returns: Territory-scoped summary
- Additional Endpoints:
  - `GET /api/managers/dealers` - Assigned dealers
  - `GET /api/managers/approval-queue` - Pending approvals
  - `GET /api/reports/dealer-performance` - Sales trend
  - `GET /api/managers/recent-activity` - Recent activity

## Manager Dashboard (Generic)
**Main Endpoint:** `GET /api/reports/dashboard/manager`
- Returns: Manager-scoped summary
- Additional Endpoints:
  - `GET /api/managers/dealers` - Assigned dealers
  - `GET /api/pricing/pending` - Pending pricing requests
  - `GET /api/messages` - Recent messages
  - `GET /api/campaigns/active` - Active campaigns
  - `GET /api/inventory/summary` - Inventory summary
  - `GET /api/reports/dealer-performance` - Sales trend

## Dealer Admin Dashboard
**Main Endpoint:** `GET /api/reports/dashboard/dealer`
- Returns: Dealer-scoped summary (sales, outstanding, invoices, orders)
- Additional Endpoints:
  - `GET /api/invoices` - Dealer invoices
  - `GET /api/orders/my` - Dealer orders
  - `GET /api/payments/mine` - Payment requests
  - `GET /api/campaigns/active` - Active campaigns
  - `GET /api/documents` - Documents
  - `GET /api/reports/dealer-performance?trend=true` - Sales trend
  - `GET /api/inventory/summary` - Inventory
  - `GET /api/payments/due` - Due payments

## Dealer Staff Dashboard
**Main Endpoint:** `GET /api/reports/dashboard/dealer`
- Returns: Personal summary (orders, payments, tasks)
- Additional Endpoints:
  - `GET /api/orders/my` - Personal orders
  - `GET /api/payments/mine` - Personal payment requests
  - `GET /api/documents` - Documents
  - `GET /api/tasks` - Pending tasks (via TaskList component)

## Common Endpoints Used Across Dashboards

### Reports
- `GET /api/reports/dealer-performance` - Dealer performance with trend
- `GET /api/reports/regional-sales-summary` - Regional sales breakdown
- `GET /api/reports/territory` - Territory report
- `GET /api/reports/pending-approvals` - Pending approvals report

### Maps
- `GET /api/maps/dealers` - Dealer locations (scoped)
- `GET /api/maps/heatmap?granularity=region|territory|dealer` - Heatmap data

### Tasks & Approvals
- `GET /api/tasks` - Pending tasks for current user
- `GET /api/reports/pending-approvals` - All pending approvals (scoped)

### Manager APIs
- `GET /api/managers/summary` - Manager summary
- `GET /api/managers/dealers` - Assigned dealers (scoped)
- `GET /api/managers/approval-queue` - Approval queue

### Area APIs
- `GET /api/areas/dashboard/summary` - Area dashboard summary
- `GET /api/areas/dashboard/dealers` - Dealers in area
- `GET /api/areas/dashboard/approvals` - Pending approvals

## Time Range Parameters

All dashboard endpoints support time range filtering via query parameters:
- `startDate`: ISO date string (YYYY-MM-DD)
- `endDate`: ISO date string (YYYY-MM-DD)

Example:
```
GET /api/reports/dashboard/super?startDate=2024-01-01&endDate=2024-12-31
```

## Data Scoping

All endpoints automatically scope data based on user role:
- **Super Admin**: Sees all data (no scoping)
- **Regional Admin**: Sees only their region
- **Area Manager**: Sees only their area
- **Territory Manager**: Sees only their territory
- **Dealer Admin**: Sees only their dealer
- **Dealer Staff**: Sees only their own data

No manual filtering needed - backend handles scoping automatically.

