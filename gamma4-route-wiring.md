# Gamma4 Sentinel Route Wiring

## Route Definition

Add to your router (React Router v6 example):

```tsx
import Gamma4SentinelDashboard from "./components/Gamma4SentinelDashboard";

// In your route config:
<Route path="/gamma4" element={<Gamma4SentinelDashboard />} />
```

## Navigation Links

### Main Navigation Panel

```tsx
// Add to your header/nav component:
<NavLink
  to="/gamma4"
  className={({ isActive }) =>
    isActive ? "text-emerald-400 font-bold" : "text-slate-400 hover:text-slate-200"
  }
>
  Γ₄ Sentinel
</NavLink>
```

### Dashboard Navigation

```tsx
// In dashboard sidebar or quick-access panel:
<div className="dashboard-nav">
  <a href="/gamma4" className="dashboard-card gamma4">
    <div className="icon">🛡️</div>
    <div className="label">Γ₄ Sentinel</div>
    <div className="status">VIGIL v1.0180</div>
  </a>
</div>
```

## App.tsx / Root Integration

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Gamma4SentinelDashboard from "./components/Gamma4SentinelDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gamma4" element={<Gamma4SentinelDashboard />} />
        {/* other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

## envelope-engine.ts — export checkMFCSInvariants

```typescript
// In your envelope engine, ensure this is exported:
export interface MFCSInvariantCheck {
  phiA: number;
  guardianAccord: number;
  breathSync: number;
  complianceStatus: "COMPLIANT" | "MARGINAL" | "BREACH";
}

export function checkMFCSInvariants(state: MFCSInvariantCheck): boolean {
  const PHI_A_THRESHOLD = 1618;
  const GUARDIAN_ACCORD_MIN = 5;
  const BREATH_SYNC_TOLERANCE = 42;
  return (
    state.phiA >= PHI_A_THRESHOLD &&
    state.guardianAccord >= GUARDIAN_ACCORD_MIN &&
    Math.abs(state.breathSync) <= BREATH_SYNC_TOLERANCE
  );
}
```

Ensure `checkMFCSInvariants` is exported and imported in `App.tsx` or the Gamma4 dashboard as needed.
