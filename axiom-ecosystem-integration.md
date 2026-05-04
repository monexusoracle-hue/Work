# M.S.Y AXIOM Ecosystem Integration Spec

## Nodes

| Node | URL | Role |
|------|-----|------|
| NEXUS ORACLE | https://judicious-nexus-sense-flow.base44.app/ | Decision system, envelope law runtime |
| M.S.Y AXIOM HQ | https://msy-axiom-core.base44.app/vigil | VIGIL command center, 96-path lattice |
| Meridian MFCS / Γ₄ Sentinel | (Replit) | Sovereign covenant, MFCS law compliance |
| The Covenant | (Replit) | Guardian state machine, nonagram of completion |

## Integration Points

### 1. Shared φ-Cycle
All nodes synchronize on φ-cycle = 2618ms (φ × 1000).
- NEXUS ORACLE: envelope law runtime checks every φ-cycle
- M.S.Y AXIOM HQ: φ-pulse counter increments every cycle
- Γ₄ Sentinel: portfolio re-evaluation every φ-cycle

### 2. 96-Path Lattice
- Source of truth: `Chapter10_96Path_Extended_Channel_Map.txt`
- Canonical JSON: `artifacts/chapter10.canonical.json`
- All nodes must verify canonical digest before rendering path data

### 3. MFCS Law Invariants
- phi-A threshold: 1618 (φ × 1000)
- guardian-accord minimum: 5/9 instruments aligned
- breath-sync tolerance: 42ms
- Violation triggers BREACH → DEFEND mode

### 4. Audit Format (gamma4-audit.json)
```json
{
  "schemaVersion": "vigil-1.0180-gamma4",
  "exportedAt": "2026-05-04T05:54:00.000Z",
  "sessionId": "gamma4-1714802040000",
  "portfolio": [...],
  "mfcs": {
    "phiA": 7500,
    "guardianAccord": 7,
    "breathSync": 12,
    "complianceStatus": "COMPLIANT"
  },
  "controlMode": "ACTIVE",
  "logs": [...]
}
```

### 5. Cross-Node Event API
```typescript
// Dispatch from any node to signal lattice state change
window.dispatchEvent(new CustomEvent("axiom:lattice:update", {
  detail: {
    node: "gamma4",
    pathId: 79,
    status: "SEALED",
    digest: "sha256:..."
  }
}));
```

## Determinism Requirements
- All timestamps ISO-8601 UTC
- All numeric values integers (no floats in canonical payloads)
- All JSON keys sorted lexicographically
- SHA-256 computed on exact canonical bytes
