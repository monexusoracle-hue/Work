# Deterministic build graph for Chapter 10 canonicalization
# Usage: make canonicalize
# Requires: python3, source file at Chapter10_96Path_Extended_Channel_Map.txt

SOURCE := Chapter10_96Path_Extended_Channel_Map.txt
CANONICAL := artifacts/chapter10.canonical.json
PRETTY := artifacts/chapter10.canonical.pretty.json
MANIFEST := artifacts/chapter10.manifest.json
SCHEMA := schemas/chapter10.schema.json
SCRIPT := scripts/canonicalize_chapter10.py

.PHONY: all canonicalize clean verify lint

all: canonicalize verify

canonicalize: $(CANONICAL) $(PRETTY) $(MANIFEST)

$(CANONICAL) $(PRETTY) $(MANIFEST): $(SOURCE) $(SCRIPT) $(SCHEMA)
	@mkdir -p artifacts
	python3 $(SCRIPT) $(SOURCE) --schema $(SCHEMA) --out $(CANONICAL) --pretty $(PRETTY)

verify:
	@echo "Verifying canonical artifact determinism..."
	@python3 -c "\
import hashlib, sys;\
data = open('$(CANONICAL)','rb').read();\
print('CANONICAL_SHA256:', hashlib.sha256(data).hexdigest());\
print('BYTES:', len(data))"

# Re-run canonicalizer and assert identical output (determinism test)
lint:
	@echo "Running determinism test..."
	@cp $(CANONICAL) /tmp/chapter10.first.json
	@python3 $(SCRIPT) $(SOURCE) --schema $(SCHEMA) --out $(CANONICAL) --pretty $(PRETTY)
	@diff -q $(CANONICAL) /tmp/chapter10.first.json || (echo "DETERMINISM FAILURE: output changed between runs" && exit 1)
	@echo "Determinism OK"

clean:
	rm -f $(CANONICAL) $(PRETTY) $(MANIFEST)
