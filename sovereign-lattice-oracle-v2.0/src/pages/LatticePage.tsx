import React, { useState, useCallback } from 'react';
import LatticeViz from '../components/LatticeViz';
import PathInspector from '../components/PathInspector';

interface PathProof {
  path_id: number;
  guardian: string;
  channel: string;
  hexagram: number;
  timestamp: number;
  schema_hash: string;
  source_map_hash: string;
}

export default function LatticePage() {
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);
  const [proofs, setProofs] = useState<PathProof[]>([]);

  // Listen for path selection from LatticeViz
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.pathId) {
        setSelectedPathId(detail.pathId);
      }
    };
    window.addEventListener('lattice:path:select', handler);
    return () => window.removeEventListener('lattice:path:select', handler);
  }, []);

  const handleExport = useCallback((proof: PathProof) => {
    setProofs(prev => [...prev, proof]);
    // Download as JSON
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `path_${proof.path_id}_proof_${proof.timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleRedTeam = useCallback((pathId: number) => {
    // Navigate to Chapter 11 operational playbook for this path
    window.open(`/docs/chapter11-operational-playbook#path-${pathId}`, '_blank');
  }, []);

  const handleBOM = useCallback((pathId: number) => {
    // Navigate to Chapter 12 BOM for this path's device
    window.open(`/docs/chapter12-playbook#bom-path-${pathId}`, '_blank');
  }, []);

  return (
    <div className="lattice-page" style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Full-screen lattice visualization */}
      <LatticeViz />

      {/* PathInspector overlay — appears when path selected */}
      {selectedPathId && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 100,
        }}>
          <PathInspector
            pathId={selectedPathId}
            onExport={handleExport}
            onRedTeam={handleRedTeam}
            onBOM={handleBOM}
          />
          <button
            onClick={() => setSelectedPathId(null)}
            style={{
              marginTop: '12px',
              width: '100%',
              padding: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Close Inspector
          </button>
        </div>
      )}

      {/* Proof log — bottom left */}
      {proofs.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(15, 15, 25, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '16px',
          color: '#94a3b8',
          fontSize: '11px',
          maxWidth: '300px',
          zIndex: 100,
        }}>
          <div style={{ marginBottom: '8px', fontWeight: 600, color: '#e2e8f0' }}>
            Exported Proofs ({proofs.length})
          </div>
          {proofs.slice(-5).map((p, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              Path {p.path_id} — {new Date(p.timestamp).toLocaleTimeString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
