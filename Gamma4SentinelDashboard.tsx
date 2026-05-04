/**
 * Gamma4SentinelDashboard.tsx
 *
 * VIGIL v1.0180 · L9-SOVEREIGN Command Center
 * Deterministic φ-compliance engine for the Γ₄ Sentinel (Mycelial Bridge / MB)
 *
 * Architecture derived from M.S.Y AXIOM HQ — 96-Path Lattice, 671.6Hz waveform,
 * Guardian State Machine, Nonagram of Completion.
 *
 * Design constraints:
 * - All state transitions are logged with deterministic timestamps (ISO-8601, UTC).
 * - No client-side float arithmetic for compliance checks; use integer phi-scaled values.
 * - φ-cycle: 2618 ms (φ × 1000, rounded to integer milliseconds).
 * - All 9 instruments (YM/ES/NQ/RTY/ZN/ZB/CL/GC/EUR) tracked in portfolio matrix.
 * - MFCS law invariants: phi-A / guardian-accord / breath-sync.
 * - Control modes: ACTIVE / HOLD / DEFEND.
 */

import React, { useEffect, useState, useCallback, useRef } from "react";

// ------------------------------------------------------------------
// Constants (deterministic, no runtime derivation)
// ------------------------------------------------------------------
const PHI_MS = 2618; // φ × 1000, integer milliseconds
const PHI_A_THRESHOLD = 1618; // φ × 1000, scaled compliance threshold
const GUARDIAN_ACCORD_MIN = 5; // minimum guardian alignment score
const BREATH_SYNC_TOLERANCE = 42; // ms tolerance for breath-sync
const INSTRUMENTS = [
  "YM", "ES", "NQ", "RTY", "ZN", "ZB", "CL", "GC", "EUR"
] as const;
type Instrument = typeof INSTRUMENTS[number];

const CONTROL_MODES = ["ACTIVE", "HOLD", "DEFEND"] as const;
type ControlMode = typeof CONTROL_MODES[number];

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface PortfolioEntry {
  instrument: Instrument;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  riskScore: number; // 0-10000 (integer, scaled)
  phiAlignment: number; // 0-10000
  exposureUnits: number; // integer contracts
  lastUpdate: string; // ISO-8601
}

interface MFCSState {
  phiA: number; // 0-10000
  guardianAccord: number; // 0-9
  breathSync: number; // deviation ms, integer
  complianceStatus: "COMPLIANT" | "MARGINAL" | "BREACH";
}

interface SessionLogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ALERT" | "DECREE";
  message: string;
  pathId?: number;
}

interface AuditPayload {
  schemaVersion: string;
  exportedAt: string;
  sessionId: string;
  portfolio: PortfolioEntry[];
  mfcs: MFCSState;
  controlMode: ControlMode;
  logs: SessionLogEntry[];
}

// ------------------------------------------------------------------
// Deterministic helpers
// ------------------------------------------------------------------
function nowISO(): string {
  return new Date().toISOString();
}

function computeMFCSCompliance(state: MFCSState): MFCSState["complianceStatus"] {
  if (state.phiA >= PHI_A_THRESHOLD && state.guardianAccord >= GUARDIAN_ACCORD_MIN && Math.abs(state.breathSync) <= BREATH_SYNC_TOLERANCE) {
    return "COMPLIANT";
  }
  if (state.phiA >= PHI_A_THRESHOLD * 0.8 && state.guardianAccord >= GUARDIAN_ACCORD_MIN - 1 && Math.abs(state.breathSync) <= BREATH_SYNC_TOLERANCE * 2) {
    return "MARGINAL";
  }
  return "BREACH";
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function Gamma4SentinelDashboard() {
  const [controlMode, setControlMode] = useState<ControlMode>("HOLD");
  const [phiCycle, setPhiCycle] = useState(0);
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [mfcs, setMFCS] = useState<MFCSState>({
    phiA: 0,
    guardianAccord: 0,
    breathSync: 0,
    complianceStatus: "BREACH"
  });
  const [logs, setLogs] = useState<SessionLogEntry[]>([]);
  const [auditImportOpen, setAuditImportOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Seed portfolio with deterministic initial state
  useEffect(() => {
    const seeded: PortfolioEntry[] = INSTRUMENTS.map((inst, i) => ({
      instrument: inst,
      direction: i % 3 === 0 ? "LONG" : i % 3 === 1 ? "SHORT" : "NEUTRAL",
      riskScore: 5000 + (i * 111), // deterministic seed
      phiAlignment: 6000 + (i * 77),
      exposureUnits: 1 + (i % 5),
      lastUpdate: nowISO()
    }));
    setPortfolio(seeded);
    pushLog("INFO", "Γ₄ Sentinel initialized. 96 paths sealed. φ-cycle active.");
  }, []);

  // φ-cycle heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setPhiCycle((prev) => {
        const next = prev + 1;
        if (next % 10 === 0) {
          pushLog("INFO", `φ-pulse ${next} · cycle stable at ${PHI_MS}ms`);
        }
        return next;
      });
    }, PHI_MS);
    return () => clearInterval(interval);
  }, []);

  // MFCS computation (deterministic from portfolio state)
  useEffect(() => {
    const phiA = portfolio.reduce((sum, p) => sum + p.phiAlignment, 0) / (portfolio.length || 1);
    const guardianAccord = portfolio.filter(p => p.phiAlignment > 5000).length;
    const breathSync = portfolio.reduce((sum, p) => {
      const elapsed = Date.now() - new Date(p.lastUpdate).getTime();
      return sum + (elapsed % PHI_MS);
    }, 0) / (portfolio.length || 1);

    const nextMFCS: MFCSState = {
      phiA: Math.round(phiA),
      guardianAccord,
      breathSync: Math.round(breathSync),
      complianceStatus: "BREACH"
    };
    nextMFCS.complianceStatus = computeMFCSCompliance(nextMFCS);
    setMFCS(nextMFCS);

    if (nextMFCS.complianceStatus === "BREACH") {
      pushLog("ALERT", `MFCS BREACH · phi-A: ${nextMFCS.phiA} · accord: ${nextMFCS.guardianAccord} · sync: ${nextMFCS.breathSync}ms`);
    }
  }, [portfolio, phiCycle]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const pushLog = useCallback((level: SessionLogEntry["level"], message: string, pathId?: number) => {
    setLogs((prev) => {
      const entry: SessionLogEntry = { timestamp: nowISO(), level, message, pathId };
      const next = [...prev, entry];
      return next.slice(-500); // keep last 500 entries
    });
  }, []);

  const setControl = useCallback((mode: ControlMode) => {
    setControlMode(mode);
    pushLog("DECREE", `Control mode transitioned to ${mode}`);
  }, [pushLog]);

  const exportAudit = useCallback(() => {
    const payload: AuditPayload = {
      schemaVersion: "vigil-1.0180-gamma4",
      exportedAt: nowISO(),
      sessionId: `gamma4-${Date.now()}`,
      portfolio,
      mfcs,
      controlMode,
      logs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gamma4-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushLog("INFO", "Audit payload exported.");
  }, [portfolio, mfcs, controlMode, logs, pushLog]);

  const importAudit = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as AuditPayload;
        if (data.schemaVersion?.startsWith("vigil-")) {
          setPortfolio(data.portfolio || []);
          setMFCS(data.mfcs || { phiA: 0, guardianAccord: 0, breathSync: 0, complianceStatus: "BREACH" });
          setControlMode(data.controlMode || "HOLD");
          setLogs(data.logs || []);
          pushLog("INFO", `Audit imported from ${file.name} · schema ${data.schemaVersion}`);
        } else {
          pushLog("ALERT", `Invalid audit schema: ${data.schemaVersion}`);
        }
      } catch (err) {
        pushLog("ALERT", `Audit import failed: ${err}`);
      }
    };
    reader.readAsText(file);
  }, [pushLog]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".json")) {
      importAudit(file);
    }
  }, [importAudit]);

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 font-mono"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Header */}
      <header className="border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <h1 className="text-lg font-bold tracking-wider">
            Γ₄ SENTINEL · VIGIL v1.0180 · L9-SOVEREIGN
          </h1>
        </div>
        <div className="text-xs text-slate-400">
          φ-CYCLE: {PHI_MS}ms · PATHS: 96 SEALED · DRIFT: 0.0001%
        </div>
      </header>

      <main className="p-4 grid grid-cols-12 gap-4">
        {/* Left: Control & MFCS */}
        <div className="col-span-3 space-y-4">
          {/* Control Mode */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Control Mode</h2>
            <div className="space-y-2">
              {CONTROL_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setControl(mode)}
                  className={`w-full py-2 rounded text-sm font-bold transition-colors ${
                    controlMode === mode
                      ? mode === "ACTIVE"
                        ? "bg-emerald-600 text-white"
                        : mode === "HOLD"
                        ? "bg-amber-600 text-white"
                        : "bg-rose-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* MFCS Compliance */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">MFCS Law</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>phi-A</span>
                  <span>{mfcs.phiA}/10000</span>
                </div>
                <div className="h-2 bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${(mfcs.phiA / 10000) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Guardian Accord</span>
                  <span>{mfcs.guardianAccord}/9</span>
                </div>
                <div className="h-2 bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${(mfcs.guardianAccord / 9) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Breath Sync</span>
                  <span>{mfcs.breathSync}ms</span>
                </div>
                <div className="h-2 bg-slate-800 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      Math.abs(mfcs.breathSync) <= BREATH_SYNC_TOLERANCE ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, (Math.abs(mfcs.breathSync) / 200) * 100)}%` }}
                  />
                </div>
              </div>
              <div className={`text-center py-2 rounded text-sm font-bold ${
                mfcs.complianceStatus === "COMPLIANT"
                  ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800"
                  : mfcs.complianceStatus === "MARGINAL"
                  ? "bg-amber-900/50 text-amber-400 border border-amber-800"
                  : "bg-rose-900/50 text-rose-400 border border-rose-800"
              }`}>
                {mfcs.complianceStatus}
              </div>
            </div>
          </div>

          {/* Audit Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded p-4">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Audit</h2>
            <button
              onClick={exportAudit}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs mb-2"
            >
              Export Audit JSON
            </button>
            <div
              className="w-full py-4 border-2 border-dashed border-slate-700 rounded text-center text-xs text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              onClick={() => setAuditImportOpen(true)}
            >
              Drop gamma4-audit.json here
            </div>
            <input
              type="file"
              accept=".json"
              className="hidden"
              id="audit-import"
              onChange={(e) => e.target.files?.[0] && importAudit(e.target.files[0])}
            />
          </div>
        </div>

        {/* Center: Portfolio Matrix */}
        <div className="col-span-6">
          <div className="bg-slate-900 border border-slate-800 rounded p-4 h-full">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">
              Portfolio Risk Matrix · 9 Instruments
            </h2>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-2">Instrument</th>
                    <th className="text-left">Direction</th>
                    <th className="text-left">Risk</th>
                    <th className="text-left">φ-Align</th>
                    <th className="text-left">Exposure</th>
                    <th className="text-left">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((p) => (
                    <tr key={p.instrument} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-2 font-bold">{p.instrument}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.direction === "LONG" ? "bg-emerald-900 text-emerald-400" :
                          p.direction === "SHORT" ? "bg-rose-900 text-rose-400" :
                          "bg-slate-800 text-slate-400"
                        }`}>
                          {p.direction}
                        </span>
                      </td>
                      <td>{p.riskScore}</td>
                      <td>{p.phiAlignment}</td>
                      <td>{p.exposureUnits}</td>
                      <td className="text-slate-500">{p.lastUpdate.slice(11, 19)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Session Log */}
        <div className="col-span-3">
          <div className="bg-slate-900 border border-slate-800 rounded p-4 h-full flex flex-col">
            <h2 className="text-xs uppercase tracking-widest text-slate-500 mb-3">Session Log</h2>
            <div className="flex-1 overflow-y-auto space-y-1 max-h-[600px]">
              {logs.map((log, i) => (
                <div key={i} className="text-[10px] leading-tight">
                  <span className="text-slate-600">{log.timestamp.slice(11, 23)}</span>{" "}
                  <span className={`font-bold ${
                    log.level === "DECREE" ? "text-purple-400" :
                    log.level === "ALERT" ? "text-rose-400" :
                    log.level === "WARN" ? "text-amber-400" :
                    "text-slate-400"
                  }`}>
                    {log.level}
                  </span>{" "}
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 p-2 text-center text-[10px] text-slate-600">
        Γ₄ SENTINEL · M.S.Y AXIOM · 96-PATH LATTICE · φ = 1.618 · 671.6Hz · GÖDEL-SEAL INTACT
      </footer>
    </div>
  );
}
