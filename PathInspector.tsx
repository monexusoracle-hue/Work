/**
 * PathInspector.tsx
 *
 * Hardened React/TypeScript component for rendering canonical Chapter10 path metadata.
 *
 * Security model:
 * - Loads ONLY artifacts/chapter10.canonical.json (compact canonical form).
 * - Verifies the canonical payload against a pinned SHA-256 before rendering.
 * - Rejects any payload that fails schema or digest validation.
 * - "Export Proof" downloads the canonical bytes (not a client-side reconstruction)
 *   so the downstream signature verifier sees the exact same bytes.
 *
 * Viz integration:
 *   window.dispatchEvent(new CustomEvent("path:select", { detail: { pathId: 42 } }));
 */

import React, { useEffect, useState, useCallback } from "react";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Device {
  type?: string;
  model?: string;
  specs?: Record<string, unknown>;
}

interface Verification {
  protocol?: string;
  challenge?: string;
  falsifyCriteria?: string;
}

interface PathEntry {
  pathId: number;
  guardian: string;
  channel: string;
  hexagrams: string[];
  notes: string;
  device: Device;
  thresholds: Record<string, unknown>;
  verification: Verification;
}

interface CanonicalModel {
  schemaVersion: string;
  canonicalizerVersion: string;
  sourceDigest: string;
  guardians: Array<{
    name: string;
    paths: PathEntry[];
  }>;
}

// ------------------------------------------------------------------
// Config (pinned at build time or injected via env)
// ------------------------------------------------------------------
const CANONICAL_URL = "/artifacts/chapter10.canonical.json";

// Expected SHA-256 of the canonical artifact. In production this is injected at build
// time from the CI manifest. Empty string disables verification (dev mode only).
const PINNED_DIGEST = process.env.REACT_APP_CHAPTER10_DIGEST || "";

// ------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------
async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function loadCanonical(): Promise<{ model: CanonicalModel; digest: string; bytes: ArrayBuffer }> {
  const res = await fetch(CANONICAL_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch canonical artifact: ${res.status} ${res.statusText}`);
  }
  const bytes = await res.arrayBuffer();
  const digest = await sha256Hex(bytes);

  if (PINNED_DIGEST && digest !== PINNED_DIGEST) {
    throw new Error(
      `Canonical artifact digest mismatch. Expected ${PINNED_DIGEST}, got ${digest}. Possible tampering or stale build.`
    );
  }

  const text = new TextDecoder("utf-8").decode(bytes);
  let model: CanonicalModel;
  try {
    model = JSON.parse(text);
  } catch (e) {
    throw new Error("Canonical artifact is not valid JSON");
  }

  if (model.schemaVersion !== "v2.0.0") {
    throw new Error(`Unsupported schema version: ${model.schemaVersion}`);
  }

  return { model, digest, bytes };
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export default function PathInspector({ pathIdProp }: { pathIdProp?: number }) {
  const [canonical, setCanonical] = useState<CanonicalModel | null>(null);
  const [canonicalBytes, setCanonicalBytes] = useState<ArrayBuffer | null>(null);
  const [entry, setEntry] = useState<PathEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectPath = useCallback(
    (id: number) => {
      if (!canonical) {
        setEntry(null);
        return;
      }
      for (const g of canonical.guardians) {
        const found = g.paths.find((p) => p.pathId === id);
        if (found) {
          setEntry(found);
          return;
        }
      }
      setEntry({
        pathId: id,
        guardian: "UNKNOWN",
        channel: "UNKNOWN",
        hexagrams: [],
        notes: "Path not found in canonical map",
        device: {},
        thresholds: {},
        verification: {},
      });
    },
    [canonical]
  );

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const { model, bytes } = await loadCanonical();
        if (cancelled) return;
        setCanonical(model);
        setCanonicalBytes(bytes);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Unknown error loading canonical data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof pathIdProp === "number") {
      selectPath(pathIdProp);
    }
  }, [pathIdProp, selectPath]);

  useEffect(() => {
    const handler = (ev: Event) => {
      const custom = ev as CustomEvent;
      const id = custom?.detail?.pathId;
      if (typeof id === "number") {
        selectPath(id);
      }
    };
    window.addEventListener("path:select", handler);
    return () => window.removeEventListener("path:select", handler);
  }, [selectPath]);

  const exportProof = useCallback(() => {
    if (!canonicalBytes) return;
    // Export the EXACT canonical bytes — this is what the signer saw.
    const blob = new Blob([canonicalBytes], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chapter10.canonical.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [canonicalBytes]);

  if (loading) return <div className="inspector p-4">Loading canonical data…</div>;
  if (error) return <div className="inspector p-4 text-red-600">Error: {error}</div>;
  if (!entry) return <div className="inspector p-4">Select a path to inspect</div>;

  return (
    <div className="inspector p-4 bg-white dark:bg-gray-900 rounded shadow max-w-xl">
      <h3 className="text-lg font-semibold">
        Path {entry.pathId} — {entry.guardian}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 my-2">{entry.notes}</p>

      <Section title="Channel">
        <Badge text={entry.channel} />
      </Section>

      <Section title="Hexagrams">
        {entry.hexagrams.length > 0 ? entry.hexagrams.join(", ") : "—"}
      </Section>

      <Section title="Device">
        {entry.device.type ?? "—"} {entry.device.model ? `• ${entry.device.model}` : ""}
        {entry.device.specs && (
          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 overflow-auto">
            {JSON.stringify(entry.device.specs, null, 2)}
          </pre>
        )}
      </Section>

      <Section title="Thresholds">
        {Object.keys(entry.thresholds).length > 0 ? (
          <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto">
            {JSON.stringify(entry.thresholds, null, 2)}
          </pre>
        ) : (
          "—"
        )}
      </Section>

      <Section title="Verification">
        {entry.verification.protocol ? (
          <div className="text-sm space-y-1">
            <div><span className="font-medium">Protocol:</span> {entry.verification.protocol}</div>
            <div><span className="font-medium">Challenge:</span> {entry.verification.challenge}</div>
            <div><span className="font-medium">Falsify:</span> {entry.verification.falsifyCriteria}</div>
          </div>
        ) : (
          "—"
        )}
      </Section>

      <div className="flex flex-wrap gap-2 mt-4">
        <a
          href="/docs/chapter11-adversarial-lattice.md"
          className="px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-medium"
        >
          Red-Team Notes
        </a>
        <a
          href="/docs/chapter11-operational-playbook.md"
          className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-medium"
        >
          Hardware BOM
        </a>
        <button
          onClick={exportProof}
          className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-medium"
        >
          Export Canonical Bytes
        </button>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Schema: {canonical?.schemaVersion} | Canonicalizer: {canonical?.canonicalizerVersion} | Source digest: {canonical?.sourceDigest}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="my-3">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
        {title}
      </h4>
      <div className="text-sm">{children}</div>
    </section>
  );
}

function Badge({ text }: { text: string }) {
  const color =
    text === "TB"
      ? "bg-purple-100 text-purple-800"
      : text === "QPC"
      ? "bg-indigo-100 text-indigo-800"
      : text === "BFM"
      ? "bg-emerald-100 text-emerald-800"
      : text === "MB"
      ? "bg-amber-100 text-amber-800"
      : text === "DNC"
      ? "bg-rose-100 text-rose-800"
      : "bg-gray-100 text-gray-800";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}
