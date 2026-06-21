Use bun

## Codebase structure

```
index.html              HTML shell, mounts <div id="root">
package.json            Deps: React, Recharts, Vite
vite.config.js          Vite + SWC plugin, host 0.0.0.0:5173

src/
  main.jsx              Entry point, renders <App />
  App.jsx               All components, tab routing, all UI
  styles.css            Complete stylesheet

  data/
    defaults.js         Factories: createProfile, defaultPolicies, uid, subscriptionTypes

  logic/
    calculations.js     ROI math: totals, chartData, monthlyKwh, monthlyHardwareCost, monthlyLabourCost
    storage.js          localStorage load/save
    exportImport.js     Profile JSON download/upload
```
