# M.S.Y Symbol Registry Signing Bundle

This is the next layer after freezing the canonical Unicode symbol registry.

It provides:

- manifest generation
- manifest hash verification
- OpenSSL signing
- signature verification
- GitHub Actions CI guard
- operator documentation

## Files

- `.github/workflows/symbol-registry-integrity.yml`
- `scripts/generate_symbols_manifest.py`
- `scripts/verify_symbols_manifest.py`
- `scripts/sign_symbols_manifest.sh`
- `scripts/verify_symbols_signature.sh`
- `artifacts/symbols.manifest.json`
- `docs/symbol-registry-signing.md`

## Status

Production-ready as a repo drop-in.
