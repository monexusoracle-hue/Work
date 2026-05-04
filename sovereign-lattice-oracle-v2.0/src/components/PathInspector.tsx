import React, { useEffect, useState } from 'react';

// Canonical schema types — loaded from chapter10.schema.json
interface PathRecord {
  id: number;
  guardian: string;
  channel: string;
  hexagram: number;
  hexagram_name: string;
  position_in_hexagram: number;
  anatomy: string;
  function: string;
  device_type: string;
  device_model: string;
  threshold_value: number;
  threshold_unit: string;
  verification_protocol: string;
  falsification_criterion: string;
  polarity: number;
  state: string;
  activation: number;
  coherence: number;
  drift: number;
  last_update: string | null;
}

interface GuardianConfig {
  name: string;
  symbol: string;
  color: string;
  ring_radius: number;
  anatomy: string;
  function: string;
}

interface ChannelConfig {
  name: string;
  guardian: string;
  substrate: string;
  analog: string;
}

interface HexagramConfig {
  id: number;
  name: string;
  region: string;
  function: string;
}

interface SchemaData {
  version: string;
  canonicalized_at: string;
  source_map_hash: string;
  guardians: Record<string, GuardianConfig>;
  channels: Record<string, ChannelConfig>;
  hexagrams: HexagramConfig[];
  paths: PathRecord[];
  triads: { id: number; paths: number[]; guardian: string; composite_polarity: number; stability: number }[];
  state_machine: Record<string, { next: string[]; description: string }>;
  metadata: {
    total_paths: number;
    total_triads: number;
    total_hexagrams: number;
    total_guardians: number;
    paths_per_hexagram: number;
    paths_per_triad: number;
  };
}

interface PathInspectorProps {
  pathId: number;
  onExport?: (proof: PathProof) => void;
  onRedTeam?: (pathId: number) => void;
  onBOM?: (pathId: number) => void;
}

interface PathProof {
  path_id: number;
  guardian: string;
  channel: string;
  hexagram: number;
  timestamp: number;
  schema_hash: string;
  source_map_hash: string;
}

const SCHEMA_URL = '/artifacts/chapter10.schema.json';

export default function PathInspector({ pathId, onExport, onRedTeam, onBOM }: PathInspectorProps) {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaHash, setSchemaHash] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load canonical schema on mount
  useEffect(() => {
    let cancelled = false;

    async function loadSchema() {
      try {
        const response = await fetch(SCHEMA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const text = await response.text();
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        const hex = Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        const data: SchemaData = JSON.parse(text);

        // Verify counts
        if (data.metadata.total_paths !== 96) {
          throw new Error(`Path count mismatch: ${data.metadata.total_paths} !== 96`);
        }
        if (data.metadata.total_triads !== 32) {
          throw new Error(`Triad count mismatch: ${data.metadata.total_triads} !== 32`);
        }

        if (!cancelled) {
          setSchema(data);
          setSchemaHash(hex);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    }

    loadSchema();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="path-inspector loading">Loading canonical schema...</div>;
  if (error) return <div className="path-inspector error">Schema load failed: {error}</div>;
  if (!schema) return null;

  const path = schema.paths.find(p => p.id === pathId);
  if (!path) return <div className="path-inspector error">Path {pathId} not found in canonical schema</div>;

  const guardian = schema.guardians[path.guardian];
  const channel = schema.channels[path.channel];
  const hexagram = schema.hexagrams.find(h => h.id === path.hexagram);
  const triad = schema.triads.find(t => t.paths.includes(pathId));

  const handleExport = () => {
    const proof: PathProof = {
      path_id: pathId,
      guardian: path.guardian,
      channel: path.channel,
      hexagram: path.hexagram,
      timestamp: Date.now(),
      schema_hash: schemaHash,
      source_map_hash: schema.source_map_hash,
    };
    onExport?.(proof);
  };

  return (
    <div className="path-inspector" style={{
      background: 'rgba(15, 15, 25, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '24px',
      color: '#e2e8f0',
      fontFamily: "'Cinzel', serif",
      maxWidth: '420px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '12px', height: '12px', borderRadius: '50%',
          background: guardian?.color || '#666',
          boxShadow: `0 0 8px ${guardian?.color || '#666'}`,
        }} />
        <div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>
            {guardian?.symbol} {guardian?.name}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Path {path.id} / 96
          </div>
        </div>
      </div>

      {/* Canonical Metadata */}
      <div style={{ fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
          <span style={{ color: '#94a3b8' }}>Channel</span>
          <span>{channel?.name} ({path.channel})</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
          <span style={{ color: '#94a3b8' }}>Hexagram</span>
          <span>{hexagram?.name} ({path.hexagram}) — {path.position_in_hexagram + 1}/6</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
          <span style={{ color: '#94a3b8' }}>Anatomy</span>
          <span>{path.anatomy}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
          <span style={{ color: '#94a3b8' }}>Function</span>
          <span>{path.function}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
          <span style={{ color: '#94a3b8' }}>Device</span>
          <span>{path.device_type} {path.device_model}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
          <span style={{ color: '#94a3b8' }}>Threshold</span>
          <span>{path.threshold_value} {path.threshold_unit}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '6px 0' }}>
          <span style={{ color: '#94a3b8' }}>Verification</span>
          <span style={{ textAlign: 'right', maxWidth: '200px' }}>{path.verification_protocol}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
          <span style={{ color: '#94a3b8' }}>Falsification</span>
          <span style={{ textAlign: 'right', maxWidth: '200px', color: '#ef4444' }}>{path.falsification_criterion}</span>
        </div>
      </div>

      {/* Triad Info */}
      {triad && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '12px',
        }}>
          <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Triad {triad.id}</div>
          <div>Paths: {triad.paths.join(', ')}</div>
          <div>Stability: {(triad.stability * 100).toFixed(1)}%</div>
        </div>
      )}

      {/* Schema Provenance */}
      <div style={{
        fontSize: '10px',
        color: '#64748b',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '12px',
        marginBottom: '16px',
        wordBreak: 'break-all',
      }}>
        <div>Schema: {schemaHash.slice(0, 16)}...</div>
        <div>Source: {schema.source_map_hash.slice(0, 16)}...</div>
        <div>Version: {schema.version}</div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleExport}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'Cinzel', serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Export Proof
        </button>
        <button
          onClick={() => onRedTeam?.(pathId)}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'Cinzel', serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Red Team
        </button>
        <button
          onClick={() => onBOM?.(pathId)}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
            color: '#06b6d4',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'Cinzel', serif",
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          BOM
        </button>
      </div>
    </div>
  );
}
