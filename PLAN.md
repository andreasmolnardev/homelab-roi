# Homelab ROI Calculator — Implementation Plan

## Goal

Build a client-side React JavaScript app that calculates the return on investment of a homelab.

The app should help users compare:

- Hardware purchase costs
- Electricity costs
- Homelab-caused recurring costs
- Replaced subscriptions
- Opportunistic self-hosted alternatives
- Future plans and upgrades

The app must be deployable as static files and should work fully offline.

## Tech Stack

- React
- JavaScript
- Vite
- LocalStorage for persistence
- CSS modules or plain CSS
- Recharts or Chart.js

The final app should be buildable into static HTML, CSS, and JavaScript files.

## Core Requirements

### Client-Side Only

The app must not require a backend. All data is stored in the browser using `localStorage`.

### Profiles

Users can create multiple independent profiles. Each profile contains its own hardware, subscriptions, power policies, plans, and settings.

Users must be able to create, rename, duplicate, delete, switch, export, and import profiles.

## Data Model

### Profile

```js
{
  id: "profile_123",
  name: "Main Homelab",
  createdAt: "...",
  updatedAt: "...",
  currency: "EUR",
  electricityPricePerKwh: 0.35,
  hardware: [],
  subscriptions: [],
  powerPolicies: [],
  plans: []
}
```

### Hardware

```js
{
  id: "hw_123",
  name: "N150 Mini PC",
  purchasePrice: 180,
  purchaseDate: "2026-06-01",
  wattsIdle: 8,
  wattsAverage: 14,
  wattsPeak: 25,
  powerPolicyId: "policy_123",
  notes: ""
}
```

### Power Policies

```js
{
  id: "policy_123",
  name: "Always On",
  hoursPerDay: 24,
  daysPerWeek: 7
}
```

Electricity cost calculation:

```js
monthlyKwh = wattsAverage * hoursPerDay * daysPerWeek * 4.345 / 1000
monthlyCost = monthlyKwh * electricityPricePerKwh
```

### Subscriptions

Subscription types:

- `replaced`: counts positively toward ROI.
- `homelab_cost`: counts negatively toward ROI.
- `opportunistic`: counts positively, but should be filterable.

```js
{
  id: "sub_123",
  name: "Google Drive",
  monthlyPrice: 9.99,
  type: "replaced",
  enabled: true,
  includeInDefaultRoi: true,
  notes: ""
}
```

### Plans

Plans are future changes that can be simulated and should not modify the current profile unless applied.

```js
{
  id: "plan_123",
  name: "Move Jellyfin to Mini PC",
  active: false,
  changes: {
    addHardware: [],
    removeHardwareIds: [],
    addSubscriptions: [],
    removeSubscriptionIds: [],
    electricityPricePerKwh: null
  }
}
```

## Calculations

- Monthly hardware electricity cost: sum all hardware electricity costs.
- Total hardware purchase cost: sum all hardware purchase prices.
- Monthly subscription savings: enabled `replaced` subscriptions plus opportunistic subscriptions when included.
- Monthly homelab subscription cost: enabled `homelab_cost` subscriptions.

```js
monthlyDelta = subscriptionSavings - electricityCosts - homelabSubscriptionCosts
breakEvenMonths = totalHardwareCost / monthlyDelta
```

If `monthlyDelta <= 0`, there is no break-even point.

For each month:

```js
totalDelta = cumulativeSavings - cumulativeCosts
```

## Graphs

Default graph: ROI delta. Negative means not paid off, zero means break-even, positive means profit or savings.

Alternative graph: total cost over time, including hardware cost, electricity cost, recurring homelab costs, and savings.

Graph filters:

- Include opportunistic savings
- Include planned changes
- Time range: 6 months, 1 year, 2 years, 5 years, 10 years

## UI Design

Use a clean light mode dashboard design with a light background, pill-shaped controls, rounded cards, soft borders, minimal shadows, and spacious layout.

Suggested colors:

```css
:root {
  --background: #f7f8fb;
  --surface: #ffffff;
  --surface-muted: #f1f3f7;
  --text: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --accent: #2563eb;
  --accent-soft: #dbeafe;
  --danger: #dc2626;
  --success: #16a34a;
}
```

## Main Layout

Sections:

- Sidebar or top navigation
- Main dashboard area
- Profile switcher
- Import/export menu

Navigation tabs:

- Dashboard
- Hardware
- Subscriptions
- Power Policies
- Plans
- Settings

## Pages

### Dashboard Page

Shows monthly delta, total hardware cost, monthly electricity cost, monthly savings, break-even date, ROI graph, and active filters.

### Hardware Page

Supports hardware list, add, edit, delete, power policy assignment, and estimated monthly electricity cost per device.

### Subscriptions Page

Supports add, edit, delete, enabled toggle, and filtering by type.

### Power Policies Page

Supports add, edit, delete, and estimated active hours per month. Default policies are Always On, Night Shutdown, and Weekend Only.

### Plans Page

Supports creating plans, toggling simulation, adding planned hardware and subscription changes, previewing ROI impact, and applying plans.

### Settings Page

Supports currency, electricity price, default graph range, opportunistic savings default, reset profile, export profile, and import profile.

## LocalStorage Structure

Use one root key: `homelab_roi_app`.

```js
{
  activeProfileId: "profile_123",
  profiles: {
    "profile_123": {}
  }
}
```

## Suggested File Structure

```txt
src/
  App.jsx
  main.jsx
  styles.css
  logic/
    calculations.js
    storage.js
    exportImport.js
  data/
    defaults.js
```

## Implementation Order

1. Project setup
2. Storage
3. Hardware
4. Subscriptions
5. Dashboard
6. Plans
7. Polish

## Important UX Details

- Never require login
- Never require internet
- Make all data portable
- Make calculations transparent
- Use optimistic editing
- Autosave changes to LocalStorage
- Prefer simple forms over complex tables
- Make the dashboard useful immediately after first setup

## Definition of Done

The app is complete when a user can create a profile, add hardware, add power policies, add subscriptions, see monthly ROI delta, see break-even estimate, simulate future plans, export and import profile data, and deploy the app as static files.
