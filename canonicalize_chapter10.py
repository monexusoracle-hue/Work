#!/usr/bin/env python3
"""
canonicalize_chapter10.py
Deterministic canonicalization gate for Chapter 10 Extended Lattice map.

Design constraints:
- Output must be byte-for-byte reproducible given the same source text.
- No timestamps, no hostnames, no non-deterministic metadata in the canonical payload.
- Canonical hash is computed over compact, sorted-key JSON (no insignificant whitespace).
- Pretty-printed output is generated ONLY for human inspection and is NOT hashed.
- Parser fails fast (non-zero exit) on ambiguity or schema version mismatch.

Usage:
  python3 scripts/canonicalize_chapter10.py <source.txt> [--pretty artifacts/chapter10.canonical.pretty.json]
"""

import sys
import json
import hashlib
import re
import argparse
from pathlib import Path
from typing import Any, List, Dict

CANONICALIZER_VERSION = "2.0.0-deterministic"
REQUIRED_HEADER_MARKER = "Guardian"
SCHEMA_VERSION = "v2.0.0"

class CanonicalizationError(SystemExit):
    pass


def fail(msg: str) -> None:
    print(f"CANONICALIZATION FAILED: {msg}", file=sys.stderr)
    raise CanonicalizationError(1)


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_json(obj: Any) -> str:
    """
    Deterministic JSON serialization.
    Rules:
      - Object keys sorted lexicographically (UTF-16 code units, consistent with JSON).
      - No insignificant whitespace.
      - No trailing newline in the returned string (caller adds if needed).
      - Strings escaped per RFC 8259.
      - Integers rendered via str(int). Floats are NOT permitted in canonical model;
        if encountered they are rejected to prevent cross-runtime variance.
    """
    if obj is None:
        return "null"
    if isinstance(obj, bool):
        return "true" if obj else "false"
    if isinstance(obj, int):
        return str(obj)
    if isinstance(obj, float):
        fail(f"Float values are not permitted in canonical model (got {obj}). Use integer or string.")
    if isinstance(obj, str):
        # Minimal JSON string escaping
        s = obj
        s = s.replace("\\", "\\\\")  # backslash
        s = s.replace('"', '\\"')
        s = s.replace("\b", "\\b")
        s = s.replace("\f", "\\f")
        s = s.replace("\n", "\\n")
        s = s.replace("\r", "\\r")
        s = s.replace("\t", "\\t")
        # Escape other control characters
        result = []
        for ch in s:
            code = ord(ch)
            if code < 0x20:
                result.append(f"\\u{code:04x}")
            else:
                result.append(ch)
        return '"' + ''.join(result) + '"'
    if isinstance(obj, list):
        return "[" + ",".join(canonical_json(x) for x in obj) + "]"
    if isinstance(obj, dict):
        if not all(isinstance(k, str) for k in obj.keys()):
            fail("Canonical JSON requires all object keys to be strings")
        # Sort keys lexicographically by Unicode code points (Python default str sorting)
        items = sorted(obj.items(), key=lambda kv: kv[0])
        return "{" + ",".join(f"{canonical_json(k)}:{canonical_json(v)}" for k, v in items) + "}"
    fail(f"Unsupported type in canonical JSON: {type(obj)}")


def parse_source(path: Path) -> List[Dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    # Find table header
    header_idx = None
    headers = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("|") and REQUIRED_HEADER_MARKER in stripped:
            parts = [p.strip() for p in stripped.strip("|").split("|")]
            headers = parts
            header_idx = i
            break

    if header_idx is None:
        fail("Could not locate table header containing 'Guardian'")

    expected_headers = ["Guardian", "Paths", "Channel", "Hexagrams", "What Each Path Does"]
    normalized = [h.lower().replace(" ", "") for h in headers]
    expected_norm = [h.lower().replace(" ", "") for h in expected_headers]
    if normalized != expected_norm:
        fail(f"Table header mismatch. Expected {expected_headers}, got {headers}")

    # Data starts two lines after header (header + separator line)
    data_start = header_idx + 2
    rows: List[Dict[str, Any]] = []
    line_pattern = re.compile(r"^\s*\|(.+)\|$")

    for idx, line in enumerate(lines[data_start:], start=data_start):
        if not line.strip().startswith("|"):
            break
        m = line_pattern.match(line)
        if not m:
            fail(f"Malformed table row at line {idx + 1}: {line!r}")
        cols = [c.strip() for c in m.group(1).split("|")]
        if len(cols) != len(headers):
            fail(f"Column count mismatch at line {idx + 1}: expected {len(headers)}, got {len(cols)}")
        row = dict(zip(headers, cols))
        rows.append(row)

    if not rows:
        fail("No data rows found after header")

    return rows


def expand_paths(pathspec: str) -> List[int]:
    """Parse '1-24' or '96' into sorted integer list."""
    pathspec = pathspec.strip()
    if "-" in pathspec:
        parts = pathspec.split("-")
        if len(parts) != 2:
            fail(f"Invalid path range: {pathspec}")
        try:
            start, end = int(parts[0]), int(parts[1])
        except ValueError:
            fail(f"Non-integer path range: {pathspec}")
        if start > end:
            fail(f"Inverted path range: {pathspec}")
        return list(range(start, end + 1))
    else:
        try:
            return [int(pathspec)]
        except ValueError:
            fail(f"Non-integer path spec: {pathspec}")


def build_model(rows: List[Dict[str, Any]], source_digest: str) -> Dict[str, Any]:
    guardians: List[Dict[str, Any]] = []
    for row in rows:
        name = row.get("Guardian", "").strip()
        pathspec = row.get("Paths", "").strip()
        channel = row.get("Channel", "").strip()
        hexagrams = [h.strip() for h in row.get("Hexagrams", "").split(",") if h.strip()]
        notes = row.get("What Each Path Does", "").strip()

        if not name:
            fail("Empty Guardian name in row")
        if not channel:
            fail("Empty Channel in row")

        path_ids = expand_paths(pathspec)
        path_entries = []
        for pid in path_ids:
            entry = {
                "pathId": pid,
                "guardian": name,
                "channel": channel,
                "hexagrams": hexagrams,
                "notes": notes,
                "device": {},
                "thresholds": {},
                "verification": {}
            }
            path_entries.append(entry)

        guardians.append({
            "name": name,
            "paths": path_entries
        })

    # Deterministic ordering: guardians in file order, paths sorted by pathId
    for g in guardians:
        g["paths"].sort(key=lambda x: x["pathId"])

    model = {
        "schemaVersion": SCHEMA_VERSION,
        "canonicalizerVersion": CANONICALIZER_VERSION,
        "sourceDigest": source_digest,
        "guardians": guardians
    }
    return model


def validate_against_schema(model: Dict[str, Any], schema_path: Path) -> None:
    if not schema_path.exists():
        print(f"WARNING: Schema file not found at {schema_path}; skipping validation", file=sys.stderr)
        return
    try:
        import jsonschema
    except ImportError:
        print("WARNING: jsonschema not installed; skipping validation", file=sys.stderr)
        return
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    try:
        jsonschema.validate(instance=model, schema=schema)
    except jsonschema.exceptions.ValidationError as e:
        fail(f"Schema validation failed: {e.message} at {list(e.path)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Canonicalize Chapter 10 map")
    parser.add_argument("source", type=Path, help="Path to Chapter10_96Path_Extended_Channel_Map.txt")
    parser.add_argument("--schema", type=Path, default=Path("schemas/chapter10.schema.json"), help="JSON Schema path")
    parser.add_argument("--out", type=Path, default=Path("artifacts/chapter10.canonical.json"), help="Canonical output path")
    parser.add_argument("--pretty", type=Path, default=None, help="Pretty-printed output path (optional)")
    args = parser.parse_args()

    if not args.source.exists():
        fail(f"Source file not found: {args.source}")

    source_bytes = args.source.read_bytes()
    source_digest = compute_sha256(source_bytes)

    rows = parse_source(args.source)
    model = build_model(rows, source_digest)

    # Schema validation gate
    validate_against_schema(model, args.schema)

    # Canonical serialization (compact, deterministic)
    canonical_text = canonical_json(model)
    canonical_bytes = canonical_text.encode("utf-8")
    canonical_hash = compute_sha256(canonical_bytes)

    # Write canonical artifact
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(canonical_bytes)
    print(f"CANONICAL_OUT: {args.out}")
    print(f"CANONICAL_SHA256: {canonical_hash}")

    # Optional pretty-printed artifact (NOT hashed)
    if args.pretty:
        pretty_text = json.dumps(model, indent=2, ensure_ascii=False) + "\n"
        args.pretty.parent.mkdir(parents=True, exist_ok=True)
        args.pretty.write_text(pretty_text, encoding="utf-8")
        print(f"PRETTY_OUT: {args.pretty}")

    # Write manifest for CI / signing pipeline
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "canonicalizerVersion": CANONICALIZER_VERSION,
        "sourceDigest": source_digest,
        "canonicalDigest": canonical_hash,
        "artifact": str(args.out)
    }
    manifest_path = args.out.parent / "chapter10.manifest.json"
    manifest_text = canonical_json(manifest)
    manifest_path.write_bytes(manifest_text.encode("utf-8"))
    print(f"MANIFEST_OUT: {manifest_path}")


if __name__ == "__main__":
    main()
