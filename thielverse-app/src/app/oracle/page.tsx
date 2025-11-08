"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { predictions, verificationLayer, pulseStart } from "@/demo/oracle";

function fmt(n: number) {
  return n.toLocaleString();
}

export default function OracleDemoPage() {
  // live-ish counters
  const [receipts, setReceipts] = useState(pulseStart.receipts);
  const [entities, setEntities] = useState(pulseStart.entities);
  const [models, setModels] = useState(pulseStart.models);
  const [q, setQ] = useState('Show me companies that will dominate AI in 2026');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t = setInterval(() => {
      setReceipts((n) => n + Math.floor(Math.random() * 900 + 100)); // 100–1000
      setEntities((n) => n + Math.floor(Math.random() * 5));
      setModels((n) => n + (Math.random() < 0.04 ? 1 : 0));
    }, 700);
    return () => clearInterval(t);
  }, []);

  const top = useMemo(() => predictions.slice(0, 2), []);

  return (
    <main className="mx-auto max-w-5xl p-6 text-neutral-200">
      <div className="mb-8">
        <div className="text-xs inline-flex items-center gap-2 rounded-full border border-neutral-800 px-3 py-1">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
          DEMO MODE · “jerryrigged superintelligence. receipts in. bias out.”
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">The Time Machine</h1>
        <p className="text-neutral-400 mt-1">Investors don’t need more data — they need a time machine.</p>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm outline-none focus:border-neutral-600"
            placeholder='Ask anything… e.g. "Show me companies that will dominate AI in 2026"'
          />
          <button className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500">
            Enter
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-800 overflow-hidden">
        <div className="bg-neutral-900/60 px-5 py-3 text-sm text-neutral-300">
          PREDICTED 2026 AI LEADERS <span className="text-neutral-500">({Math.round(top[0].confidence * 100)}–{Math.round(top[1].confidence * 100)}% confidence)</span>
        </div>
        <div className="divide-y divide-neutral-850">
          {top.map((p, i) => (
            <div key={p.slug} className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium">
                  {i + 1}. {p.name} <span className="text-neutral-400 text-sm">— {p.blurb}</span>
                </div>
                <div className="text-sm text-teal-300">{Math.round(p.confidence * 100)}% confidence</div>
              </div>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs uppercase text-neutral-400">Why</div>
                  <ul className="mt-1 text-sm list-disc pl-4">
                    {p.why.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs uppercase text-neutral-400">Signals</div>
                  <ul className="mt-1 text-sm list-disc pl-4">
                    {p.signals.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs uppercase text-neutral-400">Risk</div>
                  <div className="text-sm mt-1">{p.risk}</div>
                  <a href="#" className="underline text-xs mt-2 inline-block">View Analysis</a>
                  <a href="#" className="underline text-xs mt-2 ml-4 inline-block">See Supporting Evidence ({fmt(p.receiptsCount)} receipts)</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-neutral-800 p-5">
          <div className="text-sm text-neutral-400">Verification Layer</div>
          <ul className="mt-2 text-sm grid grid-cols-2 gap-2">
            <li>✓ {verificationLayer.papers} research papers</li>
            <li>✓ {verificationLayer.patents} patent filings</li>
            <li>✓ {verificationLayer.grants} government grants</li>
            <li>✓ {verificationLayer.comps} competition wins</li>
            <li>✓ {verificationLayer.hiring} hiring signals</li>
            <li>✓ {verificationLayer.sec} SEC filings</li>
          </ul>

          <div className="mt-4 text-sm text-neutral-400">Pattern Confirmation</div>
          <ul className="mt-2 text-sm grid grid-cols-2 gap-2">
            <li>Team quality: 92/100</li>
            <li>Execution velocity: 88/100</li>
            <li>Market timing: 76/100</li>
            <li>Capital efficiency: 81/100</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-neutral-800 p-5">
          <div className="text-sm text-neutral-400">Scale (simulated)</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{fmt(receipts)}</div>
          <div className="text-xs text-neutral-400">RECEIPTS VERIFIED</div>

          <div className="mt-4 text-xl font-semibold">{fmt(entities)}</div>
          <div className="text-xs text-neutral-400">ENTITIES TRACKED</div>

          <div className="mt-4 text-xl font-semibold">{fmt(models)}</div>
          <div className="text-xs text-neutral-400">PREDICTIVE MODELS</div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-neutral-800 p-5">
        <div className="text-sm text-neutral-400">The Close</div>
        <p className="mt-2 text-sm">
          We’re not selling data — we’re selling foresight. VCs, universities, and founders pay for advantage. This is the
          progress graph turned into an oracle.
        </p>
      </section>

      <div className="mt-10 text-xs text-neutral-500">Note: Demo view with precomputed predictions and simulated scale. Live receipts continue to flow on the main feed.</div>
    </main>
  );
}
