# Homelab ROI Calculator

A client-side React app that calculates the return on investment of a homelab by comparing hardware costs, electricity usage, and replaced subscriptions.

## Features

- **Profiles** — create, rename, duplicate, export, import multiple independent profiles
- **Hardware** — track purchase price, power draw, and power policy per device
- **Subscriptions** — mark subscriptions as replaced, homelab costs, or opportunistic savings
- **Power Policies** — define runtime schedules (Always On, Night Shutdown, etc.)
- **Plans** — simulate future hardware/subscription changes before applying them
- **Dashboard** — monthly net delta, break-even estimate, ROI/cost charts with filters
- **Maintenance** — labour cost tracking (weekly/monthly hours × hourly rate)
- **Fully offline** — all data stored in localStorage, no backend required

## Usage

```bash
bun dev      # start dev server at localhost:5173
bun build    # build static files to dist/
bun preview  # preview production build
```

## Stack

React, Vite, Recharts, plain CSS.
