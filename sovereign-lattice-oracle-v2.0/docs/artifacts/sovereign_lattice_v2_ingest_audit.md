# Sovereign Lattice v2.0 — Ingest Audit

**Audit Date:** 2026-05-04T17:37:00Z
**Auditor:** Operator-grade systems review
**Scope:** Full bundle ingest
**Status:** STAGED — deterministic assets verified, workflow bits safe, Gamma4 runtime claims excluded

---

## 1. Ingested Assets (Canonical)

| Asset | File | Size | SHA-256 | Status |
|-------|------|------|---------|--------|
| Authoritative Source Map | `Chapter10_96Path_Extended_Channel_Map.txt` | 13,902 bytes | `7d756e4a...f633bdb` | Ingested |
| Canonicalizer | `scripts/canonicalize_chapter10.py` | 8,665 bytes | computed | Ingested |
| Generated Schema | `schemas/chapter10.schema.json` | 172,709 bytes | `c4291ef7...26681f` | Verified |
| PathInspector | `src/components/PathInspector.tsx` | 10,511 bytes | computed | Staged |
| LatticePage | `src/pages/LatticePage.tsx` | 3,772 bytes | computed | Staged |
| Makefile | `Makefile` | 3,304 bytes | computed | Ingested |
| CI Workflow | `.github/workflows/chapter-canonicalize.yml` | 2,697 bytes | computed | Ingested |

---

## 2. Verification Results

### 2.1 Source Map Validation

- Lines: 153
- Paths parsed: 96
- Triads built: 32
- Hexagrams: 16
- Guardians: 5
- Channels: 5
- Fields per path: 14

Checks:
- Path IDs contiguous 1-96
- Each path has exactly 1 guardian, 1 channel, 1 hexagram
- All 14 fields present on every line
- No duplicate path IDs
- No empty or malformed lines

### 2.2 Schema Validation

- Version: v2.0.0-sovereign
- Source map hash: 4fcaec13fab7e082ff9b9ae78670cda2f1708e858893edf5da0f05d390c3d924
- Schema SHA-256: c4291ef7b58ec2c0370d44ae6e5be529e2256ac72c996164d18c9e56d026681f

Checks:
- JSON valid and parseable
- metadata.total_paths === 96
- metadata.total_triads === 32
- metadata.total_hexagrams === 16
- metadata.total_guardians === 5
- All paths have polarity, state, activation, coherence, drift initialized
- Adjacency matrix is 96x96
- State machine has S0-S7 with correct transitions
- Deterministic serialization: sort_keys=True, ensure_ascii=False

### 2.3 TypeScript Validation

- PathInspector.tsx: 0 errors, 0 warnings
- LatticePage.tsx: 0 errors, 0 warnings

Checks:
- All interfaces match schema structure
- No `any` types in canonical data paths
- Event listeners properly typed (CustomEvent)
- Cleanup functions present (useEffect return)
- Schema URL is relative (/artifacts/chapter10.schema.json)

### 2.4 Python Validation

- canonicalize_chapter10.py: Syntax OK (py_compile)

Checks:
- No runtime dependencies beyond stdlib
- Deterministic output (same input -> same output, same hash)
- Proper error handling for malformed lines
- CLI interface with argparse

---

## 3. Excluded Assets (Non-Canonical)

| Asset | Reason | Decision |
|-------|--------|----------|
| Gamma4SentinelDashboard.tsx | Encoding damage, float/timestamp-heavy runtime payloads | Excluded |
| Gamma4 audit JSONs | Stronger claims than checked-in system can support | Excluded |
| sim.harness.test.ts | Missing vitest dependency (pre-existing failure) | Noted, not fixed |

Rationale: Gamma4 runtime claims require live hardware data that the current repo cannot verify. Promoting them to canonical status would create a truth gap between the schema and observable reality.

---

## 4. Staged but Not Wired

| Component | Blocker | Resolution Path |
|-----------|---------|-------------------|
| PathInspector -> LatticePage | Needs LatticeViz component in repo | Port LatticeViz.tsx from v2.0 bundle |
| PathInspector -> CodexPage | Needs route + nav link update | Add /vigil/lattice-viz route |
| Schema artifact pipeline | Needs public/artifacts/ directory | Create at build time, copy schema post-canonicalization |
| Hash lock | Needs manual review of first schema | Run make lock-hash after operator review |

---

## 5. Blockers -> Actions

| Blocker | Action | Owner | ETA |
|---------|--------|-------|-----|
| Missing LatticeViz.tsx in repo | Port from v2.0 bundle or build fresh | Build team | M1 |
| Missing vitest dependency | Add to package.json or remove test | Dev team | M1 |
| .canonical-hash not committed | Run make lock-hash after review | Operator | M1 |
| public/artifacts/ not in build | Add copy step to vite.config.ts | Dev team | M1 |

---

## 6. Deterministic Guarantees Post-Ingest

- 96 paths — immutable, sourced from Chapter10_96Path_Extended_Channel_Map.txt
- 32 triads — derived deterministically from path list order
- 16 hexagrams — fixed, each with 6 paths
- 5 guardians — fixed, each with defined anatomy/function/color
- 5 channels — fixed, each with defined substrate/analog
- Schema hash: c4291ef7...26681f (until source map changes)
- Source map hash: 4fcaec13...c3d924
- State machine: S0->S1->S2->S3->S4->S5, with S6 recovery, S7 terminal

---

## 7. Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Operator Review | Waleed | 2026-05-04 | Staged |
| Canonicalization | Automated | 2026-05-04 | Verified |
| Integration | Pending | — | Blocked on LatticeViz port |

---

Next Action: Port LatticeViz.tsx from the v2.0 bundle, wire PathInspector into LatticePage, run make lock-hash after operator review, commit .canonical-hash to repo.
