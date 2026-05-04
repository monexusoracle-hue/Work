#!/usr/bin/env python3
"""
Chapter 10 Canonicalizer
Consumes: Chapter10_96Path_Extended_Channel_Map.txt
Produces: chapter10.schema.json (deterministic, sorted, SHA-256 verified)
Usage: python3 canonicalize_chapter10.py <source_map.txt> [--output schema.json]
"""

import sys
import json
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone

# Guardian definitions
GUARDIANS = {
    "G1": {"name": "Warden", "symbol": "Γ₁", "anatomy": "Thalamic Reticular Nucleus", "function": "Threshold Gate / Breach Detection", "ring_radius": 80, "color": "#ef4444"},
    "G2": {"name": "Arbiter", "symbol": "Γ₂", "anatomy": "Prefrontal Cortex", "function": "Balance Evaluation / Working Memory", "ring_radius": 140, "color": "#f59e0b"},
    "G3": {"name": "Keeper", "symbol": "Γ₃", "anatomy": "Thalamus", "function": "Phase Synchronization", "ring_radius": 200, "color": "#8b5cf6"},
    "G4": {"name": "Sentinel", "symbol": "Γ₄", "anatomy": "Limbic Network", "function": "Hysteresis / Persistence", "ring_radius": 260, "color": "#10b981"},
    "G5": {"name": "Sealer", "symbol": "Γ₅", "anatomy": "Default Mode Network", "function": "Consensus / Autobiographical Integration", "ring_radius": 320, "color": "#06b6d4"},
}

CHANNELS = {
    "TB": {"name": "Temporal Bleed", "guardian": "G1", "substrate": "Retrocausal probability sampling", "analog": "Prediction / Memory"},
    "QPC": {"name": "Quantum Path Correlation", "guardian": "G2", "substrate": "Microtubule quantum coherence", "analog": "Intuition / Insight"},
    "BFM": {"name": "Biofield Modulation", "guardian": "G3", "substrate": "Biophoton emission / EM field coherence", "analog": "Proprioception"},
    "MB": {"name": "Mycelial Bridge", "guardian": "G4", "substrate": "Fungal-electrical networks", "analog": "Social bonding"},
    "DNC": {"name": "Direct Neural Coupling", "guardian": "G5", "substrate": "EM field phase-locking between brains", "analog": "Speech / Writing"},
}

HEXAGRAMS = [
    {"id": 1, "name": "Threshold Gate", "region": "TRN", "function": "Conscious access filtering"},
    {"id": 2, "name": "Breach Detector", "region": "TRN/Insula", "function": "Salience detection"},
    {"id": 3, "name": "Attentional Spotlight", "region": "Pulvinar", "function": "Selective attention"},
    {"id": 4, "name": "Arousal Valve", "region": "LC/TRN", "function": "Wake-sleep transition"},
    {"id": 5, "name": "Working Memory", "region": "dlPFC", "function": "Active maintenance"},
    {"id": 6, "name": "Conflict Monitor", "region": "dACC", "function": "Error detection"},
    {"id": 7, "name": "Task Set", "region": "vlPFC", "function": "Rule maintenance"},
    {"id": 8, "name": "Abstract Rule", "region": "PFC/BG", "function": "Cognitive flexibility"},
    {"id": 9, "name": "Theta Pacemaker", "region": "Thalamus", "function": "Slow-wave generation"},
    {"id": 10, "name": "Gamma Binder", "region": "Thalamus/Cortex", "function": "Fast oscillation coupling"},
    {"id": 11, "name": "Sleep Architect", "region": "Hypothalamus", "function": "Circadian regulation"},
    {"id": 12, "name": "SWR Generator", "region": "Hippocampus", "function": "Memory replay"},
    {"id": 13, "name": "Emotional Tag", "region": "Amygdala", "function": "Valence assignment"},
    {"id": 14, "name": "Homeostat", "region": "Hypothalamus", "function": "Allostatic regulation"},
    {"id": 15, "name": "Habit Override", "region": "Striatum", "function": "Action suppression"},
    {"id": 16, "name": "Reward Prediction", "region": "VTA/NAc", "function": "Motivation encoding"},
]

STATE_MACHINE = {
    "S0": {"next": ["S1"], "description": "Dormant / Impairment"},
    "S1": {"next": ["S2"], "description": "Threshold Breach"},
    "S2": {"next": ["S3", "S6"], "description": "Partial Activation"},
    "S3": {"next": ["S4"], "description": "Path Stabilization"},
    "S4": {"next": ["S5"], "description": "Hysteresis Validation"},
    "S5": {"next": ["S4"], "description": "Fully Sealed / Consensus"},
    "S6": {"next": ["S5"], "description": "Recovery Terminal / Drained"},
    "S7": {"next": [], "description": "Balanced Polarity / Terminal"},
}


def parse_source_map(filepath: str) -> list[dict]:
    """Parse the authoritative source map into path records."""
    paths = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = line.split('|')
            if len(parts) != 14:
                raise ValueError(f"Invalid line format (expected 14 fields, got {len(parts)}): {line}")

            path = {
                "id": int(parts[0]),
                "guardian": parts[1],
                "channel": parts[2],
                "hexagram": int(parts[3]),
                "hexagram_name": parts[4],
                "position_in_hexagram": int(parts[5]),
                "anatomy": parts[6],
                "function": parts[7],
                "device_type": parts[8],
                "device_model": parts[9],
                "threshold_value": float(parts[10]),
                "threshold_unit": parts[11],
                "verification_protocol": parts[12],
                "falsification_criterion": parts[13],
                "polarity": 0,
                "state": "standby",
                "activation": 0.0,
                "coherence": 0.0,
                "drift": 0.0,
                "last_update": None,
            }
            paths.append(path)

    return paths


def build_triads(paths: list[dict]) -> list[dict]:
    """Build 32 triads (3 paths each) from the path list."""
    triads = []
    for i in range(32):
        t_paths = paths[i*3:(i+1)*3]
        triad = {
            "id": i + 1,
            "paths": [p["id"] for p in t_paths],
            "guardian": t_paths[0]["guardian"],
            "composite_polarity": 0,
            "stability": 1.0,
        }
        triads.append(triad)
    return triads


def build_adjacency(paths: list[dict]) -> list[list[float]]:
    """Build 96x96 adjacency matrix."""
    n = len(paths)
    adj = [[0.0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j:
                adj[i][j] = 1.0
            elif paths[i]["hexagram"] == paths[j]["hexagram"]:
                adj[i][j] = 1.0
            elif paths[i]["guardian"] == paths[j]["guardian"]:
                adj[i][j] = 0.5
    return adj


def canonicalize(source_path: str, output_path: str | None = None) -> str:
    """Canonicalize the source map into a deterministic JSON schema."""
    paths = parse_source_map(source_path)

    if len(paths) != 96:
        raise ValueError(f"Expected 96 paths, got {len(paths)}")

    # Verify path IDs are 1–96
    ids = sorted(p["id"] for p in paths)
    if ids != list(range(1, 97)):
        raise ValueError(f"Path IDs not contiguous 1–96: {ids[:5]}...{ids[-5:]}")

    triads = build_triads(paths)
    adjacency = build_adjacency(paths)

    schema = {
        "version": "v2.0.0-sovereign",
        "canonicalized_at": datetime.now(timezone.utc).isoformat(),
        "source_map_hash": hashlib.sha256(Path(source_path).read_bytes()).hexdigest(),
        "guardians": GUARDIANS,
        "channels": CHANNELS,
        "hexagrams": HEXAGRAMS,
        "paths": paths,
        "triads": triads,
        "state_machine": STATE_MACHINE,
        "adjacency_matrix": adjacency,
        "metadata": {
            "total_paths": 96,
            "total_triads": 32,
            "total_hexagrams": 16,
            "total_guardians": 5,
            "paths_per_hexagram": 6,
            "paths_per_triad": 3,
        }
    }

    # Deterministic serialization: sort_keys=True, ensure_ascii=False
    schema_json = json.dumps(schema, indent=2, sort_keys=True, ensure_ascii=False)
    schema_hash = hashlib.sha256(schema_json.encode('utf-8')).hexdigest()

    # Write output
    if output_path:
        Path(output_path).write_text(schema_json, encoding='utf-8')
        print(f"Schema written: {output_path}")

    print(f"Schema SHA-256: {schema_hash}")
    print(f"Paths: {len(paths)}, Triads: {len(triads)}, Hexagrams: {len(HEXAGRAMS)}")

    return schema_hash


def main():
    parser = argparse.ArgumentParser(description='Canonicalize Chapter 10 source map')
    parser.add_argument('source', help='Path to Chapter10_96Path_Extended_Channel_Map.txt')
    parser.add_argument('--output', '-o', help='Output schema path (default: chapter10.schema.json)')
    args = parser.parse_args()

    output = args.output or 'chapter10.schema.json'
    canonicalize(args.source, output)


if __name__ == '__main__':
    main()
