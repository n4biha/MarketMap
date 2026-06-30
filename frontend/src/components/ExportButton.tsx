"use client";

import { useBrief } from "@/lib/useBrief";
import { exportBriefPdf } from "@/lib/exportBriefPdf";

export function ExportButton() {
  const brief = useBrief();
  return (
    <button
      type="button"
      onClick={() => exportBriefPdf(brief)}
      className="btn-accent rounded-lg px-5 py-2.5 text-sm font-medium"
    >
      Export
    </button>
  );
}
