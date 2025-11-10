"use client";

import { useState } from "react";
import { AnalysisModal } from "./AnalysisModal";
import { Toast } from "./Toast";

export type ReceiptRow = {
  date: string;
  frontier: string;
  source: string;
  title: string;
  cid?: string | null;
};

export default function ReceiptTable({ rows }: { rows: ReceiptRow[] }) {
  const [open, setOpen] = useState(false);
  const [cid, setCid] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const handleClick = (row: ReceiptRow) => {
    if (row.cid) {
      setCid(row.cid);
      setOpen(true);
    } else {
      setToast(true);
    }
  };

  return (
    <>
      <table className="w-full text-sm">
        <thead className="text-white/60">
          <tr className="border-b border-white/8">
            <th className="py-2.5 pl-4 text-left font-medium">Date</th>
            <th className="py-2.5 px-4 text-left font-medium">Frontier</th>
            <th className="py-2.5 px-4 text-left font-medium">Source</th>
            <th className="py-2.5 px-4 text-left font-medium">Title</th>
            <th className="py-2.5 pr-4 text-left font-medium">Analysis</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="cursor-pointer border-b border-white/[0.04] transition-all duration-150 hover:bg-white/[0.05] odd:bg-white/[0.015]"
              onClick={() => handleClick(r)}
            >
              <td className="py-3 pl-4 tabular-nums text-white/75">{r.date}</td>
              <td className="py-3 px-4">
                <span className="inline-block rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-white/80">
                  {r.frontier}
                </span>
              </td>
              <td className="py-3 px-4 text-white/65">{r.source}</td>
              <td className="py-3 px-4">
                <span className="line-clamp-1 text-white/90 underline decoration-white/15 underline-offset-2">
                  {r.title}
                </span>
              </td>
              <td className="py-3 pr-4">
                {r.cid ? (
                  <span className="font-medium text-emerald-400">Available</span>
                ) : (
                  <span className="text-white/35">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <AnalysisModal cid={cid} open={open} onClose={() => setOpen(false)} />
      <Toast
        message="Analysis coming soon"
        visible={toast}
        onClose={() => setToast(false)}
      />
    </>
  );
}
