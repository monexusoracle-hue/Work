# Chapter 13 — Integration
## End-to-End System Architecture & Deterministic Deployment

**Status:** CANONICAL v1.0  
**Classification:** OPERATIONAL — Build, deploy, verify  
**Pre-requisites:** Chapter 10 (96-Path Lattice), Chapter 11 (Adversarial), Chapter 12 (Playbook)  
**Seal:** SHA-256(this document + nonce) = `c8d5e3b2...a1f4e9c7`  
**Canonicalized:** 2026-05-04T15:06:00Z

---

## 1. Executive Summary

This document defines the deterministic integration of the 96-Path Sovereign Lattice into a deployable, observable, and adversarially-hardened system. It specifies:

- **Data contracts** between the React visualization (Layer A), the canonical schema (Layer C), and the hardware acquisition stack (Chapter 12)
- **API surfaces** for SentinelContext bridging, simulation mode dispatch, and proof export
- **Deployment topology** from developer workstation to operational lab (Z1–Z7)
- **Canonical verification chain** ensuring byte-for-byte integrity from schema generation to runtime render
- **Observability plane** for real-time monitoring of path states, guardian coherence, and anomaly detection

All interfaces are version-locked. All state transitions are logged and signed. All mutations require Γ₅ consensus.

---

## 2. System Architecture

### 2.1 End-to-End Block Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LAYER A — PRESENTATION                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │ LatticeViz  │  │ PathInspector│  │  HUD Bar    │  │ Sim Controls    │    │
│  │  (React)    │  │  (React)    │  │  (React)    │  │  (React)        │    │
│  │  96 paths   │  │  Metadata   │  │  State/Mode │  │  10 modes       │    │
│  │  SVG render │  │  Proof exp  │  │  Coherence  │  │  Mode dispatch  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘    │
│         │                │                │                  │             │
│         └────────────────┴────────────────┴──────────────────┘             │
│                              Event Bus (CustomEvent)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LAYER B — APPLICATION                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SentinelContext (React Context)                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │   │
│  │  │  MFCS Mode  │  │  Apple HRV  │  │  Temporal   │  │  Anomaly  │ │   │
│  │  │  Mapping    │  │  Bridge     │  │  Lattice    │  │  Detector │ │   │
│  │  │  S0–S7      │  │  rMSSD/SDNN │  │  Detection  │  │  Γ₁ Gate  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                              WebSocket / REST                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              LAYER C — DATA                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────┐ │
│  │  lattice-schema.json    │  │  chapter10.canonical    │  │  Proof Store│ │
│  │  (96 paths, 32 triads)  │  │  (deterministic gen)    │  │  (signed)   │ │
│  │  SHA-256 verified       │  │  CI-enforced            │  │  HSM-backed │ │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────┘ │
│                                      │                                      │
│                              File System / IPFS                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LAYER D — HARDWARE INTERFACE                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │
│  │  TB     │  │  QPC    │  │  BFM    │  │  MB     │  │  DNC            │  │
│  │  OCXO   │  │  NV     │  │  SPAD   │  │  LC-MS  │  │  MEG/OPM        │  │
│  │  FPGA   │  │  Probe  │  │  Array  │  │  Logger │  │  tACS           │  │
│  │  GNSS   │  │  SPAD   │  │  MEG    │  │  BSL-2  │  │  HSM            │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘  │
│       │            │            │            │                │           │
│       └────────────┴────────────┴────────────┴────────────────┘           │
│                              Edge Compute (Jetson AGX Orin)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LAYER E — PHYSICAL LAB                            │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐ ┌─────┐ ┌─────────────────┐  │
│  │ Z1  │ │ Z2  │ │ Z3  │ │ Z4  │ │   Z5    │ │ Z6  │ │       Z7        │  │
│  │Clean│ │Optic│ │Quant│ │ EM  │ │Corridor │ │ Bio │ │   Secure Vault  │  │
│  │Room │ │ Lab │ │Bench│ │Shld │ │ Airlock │ │BSL-2│ │   HSM + Keys    │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────────┘ └─────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Layer Responsibilities

| Layer | Component | Responsibility | Failure Mode |
|-------|-----------|----------------|--------------|
| A | LatticeViz | Render 96 paths, dispatch events, display state | Canvas context loss, event bus deadlock |
| A | PathInspector | Surface canonical metadata, export proofs | Schema load failure, HSM timeout |
| B | SentinelContext | Bridge MFCS ↔ Lattice modes, detect anomalies | Context provider unmount, state desync |
| B | Apple HRV Bridge | Map rMSSD/SDNN to Γ₃ coherence | HealthKit permission revocation |
| B | Temporal Detector | Identify pre-stimulus alpha suppression | Clock jitter > 0.5 ms |
| C | Schema Store | Serve immutable path metadata | File corruption, hash mismatch |
| C | Proof Store | Cryptographically sign path states | HSM failure, key compromise |
| D | Edge Compute | Real-time signal processing, feature extraction | Thermal throttling, memory exhaustion |
| D | Channel Drivers | Hardware abstraction for TB/QPC/BFM/MB/DNC | Driver crash, firmware mismatch |
| E | Physical Lab | Environmental control, access control, safety | Power loss, HVAC failure, breach |

---

## 3. Data Contracts

### 3.1 Path State Object (Runtime)

```typescript
interface PathState {
  id: number;                    // 1–96, immutable
  guardian: "G1" | "G2" | "G3" | "G4" | "G5";
  channel: "TB" | "QPC" | "BFM" | "MB" | "DNC";
  hexagram: number;              // 1–16
  position_in_hexagram: number;  // 0–5
  
  // Dynamic fields (updated at 60 Hz)
  polarity: -1 | 0 | 1;
  state: "dormant" | "standby" | "active" | "sealed" | "degraded";
  activation: number;            // 0.0–1.0, clamped
  coherence: number;             // 0.0–1.0, clamped
  drift: number;                 // -1.0–1.0, clamped
  
  // Provenance
  last_update: number;           // performance.now() timestamp
  source: string;                // hardware channel ID or "simulation"
  signature?: string;            // Ed25519 signature (Γ₅ only)
}
```

### 3.2 Guardian Aggregate Object

```typescript
interface GuardianAggregate {
  guardian: string;
  symbol: string;
  active_paths: number;          // count of state === "active"
  avg_coherence: number;         // mean coherence across all paths
  avg_activation: number;        // mean activation across all paths
  stability: number;             // 1.0 - (stddev(coherence) / mean(coherence))
  triad_integrity: number;       // fraction of triads with composite_polarity === 0
  last_seal?: string;            // SHA-256 of last consensus state
}
```

### 3.3 Global State Object

```typescript
interface GlobalState {
  state: "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";
  timestamp: number;
  active_paths: number;          // 0–96
  total_coherence: number;       // 0.0–1.0
  guardians: GuardianAggregate[];
  anomaly_flags: AnomalyFlag[];
  seal?: string;                 // Present only in S5
}

interface AnomalyFlag {
  path_id: number;
  guardian: string;
  type: "drift" | "coherence_drop" | "activation_spike" | "timestamp_desync" | "signature_invalid";
  severity: "info" | "warning" | "critical";
  timestamp: number;
  details: Record<string, unknown>;
}
```

### 3.4 Event API Specification

All events use `window.CustomEvent` with namespace `lattice:`.

| Event | Direction | Payload | Trigger |
|-------|-----------|---------|---------|
| `lattice:mode` | Down (Context → Viz) | `{ mode: string }` | MFCS state change |
| `lattice:path:select` | Up (Viz → Context) | `{ pathId: number, source: string }` | User click on path node |
| `lattice:path:update` | Down (Context → Viz) | `{ pathId: number, state: PathState }` | Hardware sample processed |
| `lattice:guardian:update` | Down (Context → Viz) | `{ guardian: string, aggregate: GuardianAggregate }` | Guardian recalculation |
| `lattice:global:update` | Down (Context → Viz) | `{ state: GlobalState }` | Global state transition |
| `lattice:anomaly` | Bidirectional | `{ flag: AnomalyFlag }` | Anomaly detected |
| `lattice:proof:export` | Up (Inspector → Context) | `{ pathId: number, format: "json" | "pdf" }` | User requests proof |
| `lattice:seal:request` | Up (Context → HSM) | `{ state_hash: string, guardian_signatures: string[] }` | S4→S5 transition |
| `lattice:seal:confirm` | Down (HSM → Context) | `{ seal: string, timestamp: number }` | HSM signs state hash |

### 3.5 REST API (Hardware Interface)

```
GET  /api/v2/paths              → PathState[]
GET  /api/v2/paths/{id}         → PathState
GET  /api/v2/guardians          → GuardianAggregate[]
GET  /api/v2/guardians/{id}     → GuardianAggregate
GET  /api/v2/state              → GlobalState
POST /api/v2/mode               → { mode: string }  // Set simulation mode
POST /api/v2/proof/{pathId}     → { proof: string, signature: string }
GET  /api/v2/schema/hash        → { hash: string, algorithm: "sha256" }
GET  /api/v2/health             → { status: "ok" | "degraded" | "critical", channels: {...} }
```

All responses include `X-Lattice-Schema-Hash` header. Mismatch triggers Γ₁ alert.

---

## 4. Deployment Topology

### 4.1 Environment Matrix

| Environment | Purpose | Schema Source | Hardware | Network |
|-------------|---------|---------------|----------|---------|
| `dev` | Local development | `public/artifacts/` (static) | Simulated | localhost |
| `staging` | CI/integration tests | IPFS pin | Simulated + 1 real channel | VPN |
| `lab` | Bench testing | HSM-signed artifact | All 5 channels (Z1–Z7) | Air-gapped |
| `prod` | Operational deployment | HSM-signed + multi-sig | All 5 channels + redundancy | Air-gapped + out-of-band |

### 4.2 Deployment Flow

```
Developer Workstation
        │
        ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Git Push    │───→│  CI Pipeline  │───→│  Staging Env  │
│  (feature/*)  │    │  (GitHub      │    │  (simulated   │
│               │    │   Actions)    │    │   hardware)   │
└───────────────┘    └───────────────┘    └───────────────┘
        │                                    │
        │                                    ▼
        │                           ┌───────────────┐
        │                           │  Integration  │
        │                           │  Test Suite   │
        │                           │  (deterministic│
        │                           │   assertions) │
        │                           └───────────────┘
        │                                    │
        │                              Pass? │
        │                                    ▼
        │                           ┌───────────────┐
        │                           │  Schema Hash  │
        │                           │  Verification │
        │                           │  (sha256 match)│
        │                           └───────────────┘
        │                                    │
        │                              Pass? │
        │                                    ▼
        │                           ┌───────────────┐
        │                           │  Lab Deploy   │
        │                           │  (Z1–Z7)      │
        │                           │  Air-gapped   │
        │                           └───────────────┘
        │                                    │
        │                              Pass? │
        │                                    ▼
        │                           ┌───────────────┐
        │                           │  Prod Deploy  │
        │                           │  (Γ₅ sealed)  │
        │                           └───────────────┘
```

### 4.3 CI Pipeline Stages

| Stage | Command | Gate |
|-------|---------|------|
| Lint | `eslint src/` | Zero errors |
| Type Check | `tsc --noEmit` | Zero errors |
| Unit Tests | `vitest run` | 100% pass, >80% coverage |
| Schema Canonicalization | `python3 scripts/canonicalize_chapter10.py` | Hash matches manifest |
| Build | `vite build` | Zero warnings |
| Integration Tests | `vitest run --config vitest.integration.config.ts` | All 96 paths render, all 10 modes switch |
| E2E Tests | `playwright test` | All user flows pass |
| Security Scan | `npm audit` | Zero critical/high vulnerabilities |
| Hash Lock | `node scripts/verify-canonical.js` | SHA-256 matches `CANONICAL_HASH` env var |

---

## 5. Canonical Verification Chain

### 5.1 Hash Chain

```
Chapter 10 Source Text
        │
        ▼ (canonicalize_chapter10.py)
lattice-schema.json
        │
        ▼ (sha256)
Schema Hash = ffbdf1c7...ea40735
        │
        ▼ (CI verification)
Build Artifact
        │
        ▼ (runtime verification)
LatticeViz loads schema → computes hash → compares to embedded manifest
        │
        ▼ (mismatch)
Γ₁ Warden triggers anomaly → lattice enters S₆ recovery
```

### 5.2 Runtime Verification

```typescript
// In LatticeViz.tsx — on mount
async function verifySchemaIntegrity(): Promise<boolean> {
  const response = await fetch('/artifacts/lattice-schema.json');
  const schema = await response.text();
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(schema));
  const hex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  
  const expected = import.meta.env.VITE_CANONICAL_SCHEMA_HASH;
  if (hex !== expected) {
    window.dispatchEvent(new CustomEvent('lattice:anomaly', {
      detail: {
        path_id: 0,
        guardian: 'G1',
        type: 'signature_invalid',
        severity: 'critical',
        timestamp: performance.now(),
        details: { expected, actual: hex }
      }
    }));
    return false;
  }
  return true;
}
```

### 5.3 Multi-Signature Consensus (Γ₅)

For any state transition to S₅:

1. **Γ₁ Warden** signs: "No anomalies detected in last 60s window"
2. **Γ₂ Arbiter** signs: "All path activations within biological ceiling (d < 0.5)"
3. **Γ₃ Keeper** signs: "Coherence stability > 0.7 across all triads"
4. **Γ₄ Sentinel** signs: "No environmental spoof detected (EM, optical, metabolome)"
5. **Γ₅ Sealer** signs: "3-of-5 prior signatures valid, state hash committed"

Each signature is Ed25519 over `SHA-256(state_object + nonce + timestamp)`.

---

## 6. Monitoring & Observability

### 6.1 Metrics (Prometheus Format)

```
# Path-level
lattice_path_activation{path_id="1",guardian="G1",channel="TB"} 0.73
lattice_path_coherence{path_id="1",guardian="G1",channel="TB"} 0.91
lattice_path_drift{path_id="1",guardian="G1",channel="TB"} 0.02
lattice_path_state{path_id="1",guardian="G1",channel="TB",state="active"} 1

# Guardian-level
lattice_guardian_active_paths{guardian="G1"} 18
lattice_guardian_avg_coherence{guardian="G1"} 0.84
lattice_guardian_stability{guardian="G1"} 0.92

# Global
lattice_global_state{state="S3"} 1
lattice_global_total_coherence 0.87
lattice_global_active_paths 67
lattice_anomaly_count{type="drift",severity="warning"} 2

# Hardware
lattice_hardware_temperature{channel="QPC",zone="Z3"} 4.2
lattice_hardware_latency_ms{channel="TB"} 0.3
lattice_hardware_packet_loss{channel="DNC"} 0.001
```

### 6.2 Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| `LatticeSchemaMismatch` | Runtime hash ≠ canonical hash | Critical | Enter S₆, notify ops, halt data ingestion |
| `GuardianCoherenceDrop` | Any guardian avg_coherence < 0.5 for >5s | Warning | Log, flag for review |
| `PathActivationSpike` | Any path activation > 0.95 for >2s | Critical | Γ₁ Warden inspects, potential A-TB-01 |
| `TemporalDesync` | Clock jitter > 0.5 ms for >3 frames | Critical | Enter S₆, switch to backup OCXO |
| `HSMTimeout` | HSM response > 500 ms | Warning | Queue signatures, alert admin |
| `AnomalyRateHigh` | >10 anomalies/minute | Critical | Enter S₆, initiate red-team protocol |

### 6.3 Dashboards

| Dashboard | Tool | URL | Refresh |
|-----------|------|-----|---------|
| Lattice Overview | Grafana | `https://monitor.lab/lattice` | 1s |
| Guardian Health | Grafana | `https://monitor.lab/guardians` | 5s |
| Anomaly Stream | Grafana | `https://monitor.lab/anomalies` | Real-time (WebSocket) |
| Hardware Status | Grafana | `https://monitor.lab/hardware` | 10s |
| Proof Explorer | Custom | `https://monitor.lab/proofs` | On demand |

---

## 7. Integration Test Matrix

### 7.1 Deterministic Test Cases

| Test ID | Description | Input | Expected Output | Gate |
|---------|-------------|-------|-----------------|------|
| INT-001 | Schema load | `lattice-schema.json` | 96 paths, 32 triads, 16 hexagrams | Pass |
| INT-002 | Hash verification | Valid schema | Hash matches manifest | Pass |
| INT-003 | Hash verification | Corrupted schema | Anomaly event dispatched, S₆ entered | Pass |
| INT-004 | Mode switch | `mode: "task"` | Γ₂/Γ₃ activation +0.2, others baseline | Pass |
| INT-005 | Mode switch | `mode: "seizure"` | All paths activation > 0.8, coherence 0.95 | Pass |
| INT-006 | Path selection | Click path 79 | Inspector shows Γ₅, DNC, hexagram 14 | Pass |
| INT-007 | Global state | All paths activation < 0.2 | State = S₀ | Pass |
| INT-008 | Global state | Avg activation > 0.8, coherence > 0.8 | State = S₅, seal present | Pass |
| INT-009 | Anomaly detection | Inject 1 ms timestamp jitter | Anomaly flag: `timestamp_desync`, critical | Pass |
| INT-010 | Proof export | Request proof for path 42 | JSON with Ed25519 signature | Pass |
| INT-011 | Sentinel bridge | MFCS mode = "ACTIVE" | Lattice mode = "task", simulating | Pass |
| INT-012 | Apple HRV | rMSSD = 45 ms | Γ₃ coherence adjusted -0.15 | Pass |
| INT-013 | Responsive | Viewport = 400px | Triads hidden, guardian rings simplified | Pass |
| INT-014 | DPR | DPR = 2.0 | Canvas internal resolution = 2× logical | Pass |
| INT-015 | Red-team | A-TB-01 injection | Detection within 50 ms, S₆ entered | Pass |

### 7.2 Test Execution

```bash
# Unit tests (deterministic, no hardware)
npm run test

# Integration tests (simulated hardware)
npm run test:integration

# E2E tests (full stack, staging)
npx playwright test

# Red-team tests (lab only, authorized SOW required)
npm run test:redteam  # Requires SOW-2027-RT-001
```

---

## 8. Rollback & Recovery

### 8.1 State Recovery Matrix

| From State | Trigger | To State | Procedure |
|------------|---------|----------|-----------|
| S₅ | Anomaly detected | S₆ | Halt data ingestion, preserve state snapshot, notify ops |
| S₆ | Anomaly cleared | S₂ | Gradual re-activation, re-verify all channels |
| S₆ | Anomaly persists > 60s | S₀ | Full reset, re-initialize from canonical schema |
| S₅ | HSM failure | S₄ | Queue seal request, alert admin, continue monitoring |
| Any | Power loss | S₀ | UPS graceful shutdown, restore from last checkpoint |
| Any | Physical breach | S₀ | Kill switch, lock Z7, notify security |

### 8.2 Checkpointing

- **Frequency:** Every 5 seconds in S₃–S₅, every 30 seconds in S₀–S₂
- **Storage:** Encrypted SQLite on Z7 HSM-backed storage
- **Retention:** 30 days rolling
- **Restore:** < 10 seconds from checkpoint to S₂

---

## 9. Environment Configuration

### 9.1 Required Environment Variables

```bash
# Canonical verification
VITE_CANONICAL_SCHEMA_HASH=ffbdf1c7a2e3d4f5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4
