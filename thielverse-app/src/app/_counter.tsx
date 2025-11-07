"use client";
import { useEffect, useState } from "react";

export default function Counter() {
  const [n, setN] = useState<number>(0);
  useEffect(() => {
    let t: any;
    const tick = async () => {
      try {
        const r = await fetch("/api/stats", { cache: "no-store" });
        const j = await r.json();
        setN(j?.total ?? 0);
      } catch {}
      t = setTimeout(tick, 2000);
    };
    tick();
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mt-2 text-sm text-neutral-400">
      Receipts indexed: <span className="text-neutral-200 font-medium">{n}</span>
    </div>
  );
}
