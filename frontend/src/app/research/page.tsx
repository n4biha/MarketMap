import Link from "next/link";
import { ResearchFlow } from "@/components/ResearchFlow";
import { SiteHeader } from "@/components/SiteHeader";

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ idea?: string }>;
}) {
  const { idea } = await searchParams;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* ambient background — depth + highlight behind the content */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-1/2 top-[24%] h-[460px] w-[1000px] max-w-[130vw] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at center, rgba(109,93,251,0.20) 0%, rgba(124,92,246,0.08) 45%, transparent 72%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse 75% 60% at 50% 42%, #000 0%, transparent 82%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 60% at 50% 42%, #000 0%, transparent 82%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[42vh]"
          style={{
            background:
              "radial-gradient(ellipse 65% 100% at 50% 130%, rgba(124,92,246,0.14) 0%, transparent 70%)",
          }}
        />
      </div>

      <SiteHeader
        action={
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.03] px-3 py-1 text-xs text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              In progress
            </span>
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur-md transition-colors hover:border-white/20 hover:text-foreground"
            >
              Cancel
            </Link>
          </div>
        }
      />

      <ResearchFlow idea={idea ?? ""} />
    </div>
  );
}
