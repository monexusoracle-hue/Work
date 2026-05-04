# Deterministic Canonicalization Notes

## What changed from the v1.0 draft

| Issue | v1.0 (original) | v2.0 (hardened) |
|-------|-----------------|-----------------|
| Timestamp | `datetime.utcnow()` injected into payload | Removed; replaced with `sourceDigest` (SHA-256 of source) |
| Serialization | `json.dumps(..., indent=2, sort_keys=True)` | Custom `canonical_json()`; no insignificant whitespace; no floats |
| Hash target | Pretty-printed text | Exact canonical bytes (compact, sorted keys) |
| Float handling | Implicit Python float serialization | Rejected in canonical model; use integer or string |
| CI behavior | Auto-commit artifact back to repo | Upload artifact only; manual promotion gate |
| Client proof | Client-side JSON reconstruction | Export of exact canonical bytes |
| Schema | None | `schemas/chapter10.schema.json` enforced in CI |
| Determinism test | None | `make lint` runs canonicalizer twice and diffs |

## How to verify

```bash
# 1. Install deps
pip install jsonschema

# 2. Run canonicalization
python3 scripts/canonicalize_chapter10.py Chapter10_96Path_Extended_Channel_Map.txt   --schema schemas/chapter10.schema.json   --out artifacts/chapter10.canonical.json   --pretty artifacts/chapter10.canonical.pretty.json

# 3. Check digest
cat artifacts/chapter10.manifest.json
sha256sum artifacts/chapter10.canonical.json

# 4. Determinism test
make lint
```

## Cross-runtime consistency

The canonical JSON serializer is pure Python with no dependency on `json` module
formatting quirks. It explicitly:
- Sorts object keys with Python's default string comparison (Unicode code points).
- Escapes strings per RFC 8259.
- Rejects float values to avoid `repr` variance across platforms.
- Emits no whitespace.

If you port the canonicalizer to another language (Rust, Go, etc.), you must
reproduce the same serialization rules and validate against the same test vectors.

## Trust model

```
Source text (authoritative)
    |
    v
Canonicalizer (deterministic, versioned)
    |
    v
Schema validation gate
    |
    v
Canonical bytes (hashed)
    |
    v
HSM signature (offline)
    |
    v
React build (pinned digest, verification only)
```

The React app never mutates canonical data. It verifies the digest and renders.
