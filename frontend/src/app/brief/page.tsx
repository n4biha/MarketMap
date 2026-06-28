import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BriefView } from "@/components/BriefView";
import { SiteHeader } from "@/components/SiteHeader";

export default async function BriefPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string }>;
}) {
  const { idea } = await searchParams;
  const ideaQuery = idea ? `?idea=${encodeURIComponent(idea)}` : "";
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* ambient top glow for depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-1/2 top-0 h-[460px] w-[1200px] max-w-[130vw] -translate-x-1/2"
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

      <main className="relative z-10 mx-auto w-full max-w-[90rem] flex-1 px-10 py-10">
        <Link
          href={`/results${ideaQuery}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to overview
        </Link>

        <BriefView idea={idea} />
      </main>
    </div>
  );
}
