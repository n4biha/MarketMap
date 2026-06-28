import { ResultsView } from "@/components/ResultsView";
import { SiteHeader } from "@/components/SiteHeader";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string }>;
}) {
  const { idea } = await searchParams;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* ambient top glow for depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-1/2 top-0 h-[420px] w-[1100px] max-w-[130vw] -translate-x-1/2"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 0%, rgba(109,93,251,0.14), transparent 70%)",
          }}
        />
      </div>

      <SiteHeader
        action={
          <button type="button" className="btn-accent rounded-lg px-5 py-2.5 text-sm font-medium">
            Export
          </button>
        }
      />

      <ResultsView idea={idea} />
    </div>
  );
}
