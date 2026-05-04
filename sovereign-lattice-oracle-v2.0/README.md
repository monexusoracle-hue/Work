# Sovereign Lattice Oracle

Deterministic canonicalization system for the 96-Path Extended Lattice.

## Structure

```
.
├── Chapter10_96Path_Extended_Channel_Map.txt   # Authoritative source
├── Makefile                                      # Build pipeline
├── scripts/
│   └── canonicalize_chapter10.py                 # Source map -> deterministic JSON
├── schemas/
│   └── chapter10.schema.json                     # Generated canonical schema
├── src/
│   ├── components/
│   │   └── PathInspector.tsx                     # Canonical schema-bound inspector
│   └── pages/
│       └── LatticePage.tsx                       # Wired with PathInspector
├── .github/workflows/
│   └── chapter-canonicalize.yml                  # CI pipeline
└── docs/
    └── artifacts/
        └── sovereign_lattice_v2_ingest_audit.md  # This audit
```

## Quick Start

```bash
# 1. Install
make install

# 2. Canonicalize (generates schema from source map)
make canonicalize

# 3. Verify (checks schema hash against locked canonical)
make verify

# 4. Full test suite
make test
```

## Deterministic Guarantees

- 96 paths, 32 triads, 16 hexagrams — immutable counts
- Schema hash: c4291ef7...26681f
- Source map hash: 4fcaec13...c3d924
- All mutations require `make lock-hash` after operator review

## Status

STAGED — deterministic assets verified, workflow bits safe, Gamma4 runtime claims excluded.

Blocker: LatticeViz.tsx needs to be ported from v2.0 bundle to wire PathInspector into LatticePage.
