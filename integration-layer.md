# Integration Layer - Wiring Chapter 10 into the React Visualizer

Status: CANONICAL v2.0.0

Purpose
-------
Define the deterministic data model and integration contract so the codespaces-react
viz can surface canonical Chapter 10 path metadata without introducing non-determinism
into the build pipeline.

Canonical Artifact
------------------
The single source of truth is:

```
artifacts/chapter10.canonical.json
```

Properties:
- Compact JSON (no insignificant whitespace).
- Keys sorted lexicographically.
- No floats; numeric thresholds are integer or string.
- No timestamps or host-dependent metadata.
- SHA-256 computed over the exact file bytes.

The React app must consume this artifact directly. Do NOT re-serialize or mutate
the JSON in the client; doing so invalidates the digest chain.

Build-time wiring
-----------------
1. CI runs `make canonicalize` (or `scripts/canonicalize_chapter10.py`).
2. CI uploads `artifacts/chapter10.canonical.json` as a build artifact.
3. The React build step copies (or references) the canonical artifact from the CI artifact store.
4. The build injects `REACT_APP_CHAPTER10_DIGEST=<sha256>` into the environment so
   `PathInspector.tsx` can verify the artifact at runtime.

Schema
------
See `schemas/chapter10.schema.json`. All canonical outputs must validate against this
schema before signing.

UI Contract: PathInspector
--------------------------
- Props: `pathIdProp?: number`
- Loads `artifacts/chapter10.canonical.json` via `fetch()` as `ArrayBuffer`.
- Computes SHA-256 client-side and compares to `REACT_APP_CHAPTER10_DIGEST`.
- On mismatch, renders a hard error (no fallback to raw text).
- Renders: Guardian, Channel, Device spec, Thresholds, Verification protocol.
- Links to `docs/chapter11-adversarial-lattice.md` and `docs/chapter11-operational-playbook.md`.
- "Export Canonical Bytes" downloads the exact `ArrayBuffer` (preserves byte identity).

Viz Event API
-------------
```typescript
// Viz dispatches
window.dispatchEvent(
  new CustomEvent("path:select", { detail: { pathId: 42 } })
);
```

`PathInspector` listens on `path:select` and updates its internal selection.

Security Requirements
---------------------
- The canonical artifact must be served with `Content-Type: application/json` and
  immutable cache headers.
- The React app must be built with a pinned digest; no dynamic fetching of
  unverified canonical files.
- Proof exports must be the canonical bytes, not a client-side reconstruction.
- HSM signing of the canonical artifact happens OUTSIDE the React build; the build
  only verifies, never signs.

CI / CD Pipeline
----------------
See `.github/workflows/chapter-canonicalize.yml`.

Key behaviors:
- Runs on source changes and PRs.
- Produces artifact; does NOT auto-commit to repo (prevents commit loops).
- Determinism test: run canonicalizer twice and `diff` the outputs.
- Manual promotion gate required to move artifact into release branch.
