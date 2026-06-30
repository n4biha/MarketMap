import { DataMeshWave } from "@/components/DataMeshWave";
import { SearchPanel } from "@/components/SearchPanel";
import { SiteHeader } from "@/components/SiteHeader";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <SiteHeader />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-7 px-6 pb-32 pt-6 text-center">
        <h1 className="font-serif text-5xl leading-[1.15] tracking-tight text-foreground sm:text-6xl">
          AI-powered market research.
          <br />
          <span className="font-serif italic text-accent">Clarity</span> in
          minutes.
        </h1>

        <p className="max-w-md text-base leading-relaxed text-muted">
          MarketMap analyzes the market, uncovers gaps, and reveals your best
          opportunities.
        </p>

        <SearchPanel />
      </main>

      <DataMeshWave />
    </div>
  );
}
