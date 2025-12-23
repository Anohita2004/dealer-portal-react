# Company Hierarchy Structure

The Dealer Management Portal follows a **geographic and role-based hierarchical system**:

## Hierarchy Tree

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN                              │
│                  (No restrictions)                          │
│                      ↓                                      │
│  ┌──────────────────────────────────────────────────┐      │
│  │          TECHNICAL ADMIN                         │      │
│  │    (Permissions & Material Master only)          │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │         REGIONAL ADMIN                           │      │
│  │      (One Region - Top of Region)                │      │
│  │                   ↓                              │      │
│  │         REGIONAL MANAGER                         │      │
│  │      (One Region - Operations)                   │      │
│  │                   ↓                              │      │
│  │            AREA MANAGER                          │      │
│  │        (Region + Area - Required)                │      │
│  │                   ↓                              │      │
│  │        TERRITORY MANAGER                         │      │
│  │    (Region + Area + Territory - Required)        │      │
│  │                   ↓                              │      │
│  │                                                 │      │
│  │            ┌─────────────────┐                 │      │
│  │            │  DEALER ADMIN   │                 │      │
│  │            │ (One Dealer)    │                 │      │
│  │            │      ↓          │                 │      │
│  │            │ DEALER STAFF    │                 │      │
│  │            │ (Same Dealer)   │                 │      │
│  │            └─────────────────┘                 │      │
│  │                                                 │      │
│  │            ┌─────────────────┐                 │      │
│  │            │ SALES EXECUTIVE │                 │      │
│  │            │ (Assigned to    │                 │      │
│  │            │  Managers +     │                 │      │
│  │            │  Dealers)       │                 │      │
│  │            └─────────────────┘                 │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │          FINANCE ADMIN                           │      │
│  │      (Financial Operations)                      │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Role Requirements & Manager Relationships

### 1. **Super Admin**
- **Geographic Requirements:** None
- **Can Have Manager:** None (top of hierarchy)
- **Scope:** Global access to all regions, areas, territories, dealers

### 2. **Technical Admin**
- **Geographic Requirements:** None
- **Can Have Manager:** None
- **Scope:** System configuration, material master, permissions

### 3. **Regional Admin**
- **Geographic Requirements:** Must be assigned to **ONE Region**
- **Can Have Manager:** None (top of regional hierarchy)
- **Scope:** Manages entire region (all areas, territories, dealers within)

### 4. **Regional Manager**
- **Geographic Requirements:** Must be assigned to **ONE Region**
- **Can Have Manager:** Regional Admin
- **Scope:** Operations oversight for entire region

### 5. **Area Manager**
- **Geographic Requirements:** Must be assigned to **ONE Region + ONE Area**
- **Can Have Manager:** Regional Manager OR Regional Admin
- **Scope:** Manages multiple territories within an area

### 6. **Territory Manager**
- **Geographic Requirements:** Must be assigned to **ONE Region + ONE Area + ONE Territory**
- **Can Have Manager:** Area Manager OR Regional Manager
- **Scope:** Manages dealers within a specific territory

### 7. **Dealer Admin**
- **Geographic Requirements:** Must be assigned to **ONE Dealer**
- **Can Have Manager:** Territory Manager OR Area Manager OR Regional Manager
- **Scope:** Manages one dealer company

### 8. **Dealer Staff**
- **Geographic Requirements:** Must be assigned to **ONE Dealer** (same as their Dealer Admin)
- **Can Have Manager:** Dealer Admin only
- **Scope:** Works for one dealer company

### 9. **Sales Executive** ⭐ (Newly Added)
- **Geographic Requirements:** **Optional** (Region/Area/Territory - recommended for hierarchy visibility)
- **Can Have Manager:** **REQUIRED** - Must report to one of:
  - Territory Manager
  - Area Manager
  - Regional Manager
  - Regional Admin
- **Scope:** Works with assigned dealers (dealers are assigned separately via Dealer Management)
- **Purpose:** Creates orders and payment requests for assigned dealers

### 10. **Finance Admin / Accounts User**
- **Geographic Requirements:** None (typically)
- **Can Have Manager:** Varies
- **Scope:** Financial operations, payment approvals

## Key Hierarchy Rules

1. **Geographic Scope Inheritance:**
   - Each manager can only see/manage entities within their geographic scope
   - Territory Manager sees only their territory
   - Area Manager sees all territories in their area
   - Regional Manager/Admin sees entire region

2. **Manager Reporting:**
   - Managers report to their immediate superior in the hierarchy
   - Sales Executives report to their assigned manager (Territory/Area/Regional Manager or Regional Admin)
   - Dealer Admin can report to Territory/Area/Regional Manager

3. **Dealer Assignment:**
   - Dealers are assigned to:
     - A geographic location (Region → Area → Territory)
     - A manager (Territory/Area/Regional Manager)
     - Sales Executives (via separate assignment system)

4. **Data Scoping:**
   - All data (orders, invoices, payments) is automatically filtered by:
     - User's geographic scope (regionId, areaId, territoryId)
     - User's dealerId (for dealer roles)
     - User's assigned dealers (for sales_executive)

## Current System Behavior

- **Geographic Hierarchy:** Region → Area → Territory → Dealer
- **Manager Hierarchy:** Regional Admin → Regional Manager → Area Manager → Territory Manager → Dealer Admin → Dealer Staff
- **Sales Executive:** Cross-cutting role that reports to managers but works with assigned dealers across territories
- **Approval Workflows:** Follow manager hierarchy (e.g., Order: Dealer Admin → Territory Manager → Area Manager → Regional Manager)

