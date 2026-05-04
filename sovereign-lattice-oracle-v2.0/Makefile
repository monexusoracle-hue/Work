# Sovereign Lattice Oracle — Makefile
# Canonicalization pipeline for Chapter 10 source map

.PHONY: all canonicalize verify lint typecheck test clean install

SOURCE_MAP := Chapter10_96Path_Extended_Channel_Map.txt
SCHEMA_OUT := schemas/chapter10.schema.json
CANONICALIZER := scripts/canonicalize_chapter10.py

# Expected SHA-256 of the canonical schema (set after first run)
CANONICAL_HASH ?= $(shell cat .canonical-hash 2>/dev/null || echo "")

all: canonicalize verify

install:
	@echo "Installing dependencies..."
	@npm install
	@pip install -r requirements.txt 2>/dev/null || true

# Step 1: Canonicalize source map → deterministic JSON schema
canonicalize: $(SOURCE_MAP) $(CANONICALIZER)
	@echo "=== Canonicalizing Chapter 10 source map ==="
	@python3 $(CANONICALIZER) $(SOURCE_MAP) --output $(SCHEMA_OUT)
	@echo "=== Schema generated ==="
	@ls -la $(SCHEMA_OUT)

# Step 2: Verify schema integrity against stored hash
verify: $(SCHEMA_OUT)
	@echo "=== Verifying canonical schema ==="
	@if [ -z "$(CANONICAL_HASH)" ]; then \
		echo "WARNING: CANONICAL_HASH not set. Run 'make canonicalize' first, then store hash."; \
		exit 1; \
	fi
	@python3 -c "
import hashlib, sys
with open('$(SCHEMA_OUT)', 'rb') as f:
    h = hashlib.sha256(f.read()).hexdigest()
expected = '$(CANONICAL_HASH)'.strip()
if h != expected:
    print(f'HASH MISMATCH: expected {expected[:16]}... got {h[:16]}...')
    sys.exit(1)
print(f'Hash verified: {h}')
"

# Step 3: Store the canonical hash after manual review
lock-hash: $(SCHEMA_OUT)
	@python3 -c "
import hashlib
with open('$(SCHEMA_OUT)', 'rb') as f:
    h = hashlib.sha256(f.read()).hexdigest()
with open('.canonical-hash', 'w') as f:
    f.write(h)
print(f'Hash locked: {h}')
"

# Step 4: TypeScript checks
lint:
	@echo "=== Running ESLint ==="
	@npx eslint src/ --ext .ts,.tsx

typecheck:
	@echo "=== Running TypeScript compiler ==="
	@npx tsc --noEmit

# Step 5: Python syntax check for canonicalizer
py-check: $(CANONICALIZER)
	@echo "=== Checking canonicalizer syntax ==="
	@python3 -m py_compile $(CANONICALIZER)
	@echo "Syntax OK"

# Step 6: Full test suite
test: canonicalize verify lint typecheck py-check
	@echo "=== Running unit tests ==="
	@npx vitest run
	@echo "=== All checks passed ==="

# Step 7: CI pipeline (no interactive steps)
ci: canonicalize verify lint typecheck py-check
	@echo "=== CI pipeline complete ==="

# Clean generated artifacts
clean:
	@rm -f $(SCHEMA_OUT)
	@rm -f .canonical-hash
	@echo "Cleaned generated artifacts"

# Help
help:
	@echo "Sovereign Lattice Oracle — Build Commands"
	@echo ""
	@echo "  make install      — Install npm and pip dependencies"
	@echo "  make canonicalize — Generate chapter10.schema.json from source map"
	@echo "  make verify       — Verify schema hash against locked canonical hash"
	@echo "  make lock-hash    — Store current schema hash as canonical (manual review required)"
	@echo "  make lint         — Run ESLint on src/"
	@echo "  make typecheck    — Run TypeScript compiler (no emit)"
	@echo "  make py-check     — Verify canonicalizer Python syntax"
	@echo "  make test         — Full test suite (canonicalize + verify + lint + typecheck + vitest)"
	@echo "  make ci           — CI pipeline (no vitest, for environments without it)"
	@echo "  make clean        — Remove generated artifacts"
