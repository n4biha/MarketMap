"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

const POPULAR_SEARCHES = [
  "AI Calendar Assistant",
  "Mental Health App",
  "Fitness Tracking App",
  "Smart Grocery List",
];

/**
 * Screen 1 search box: wide rounded input with a left icon and a purple
 * circular submit, plus "popular searches" pills that fill the input. Submitting
 * just logs the idea for now — no navigation yet.
 */
export function SearchPanel() {
  const router = useRouter();
  const [idea, setIdea] = useState("");

  function runResearch(value: string) {
    const query = value.trim();
    if (!query) return;
    // Carry the idea into the flow via a query param.
    router.push(`/research?idea=${encodeURIComponent(query)}`);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    runResearch(idea);
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <form onSubmit={handleSubmit} className="relative w-full">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="What app or product idea do you want to research?"
          aria-label="App or product idea"
          className="h-16 w-full rounded-2xl border border-[#4a3aa8]/60 bg-white/[0.04] pl-14 pr-16 text-base text-foreground shadow-[0_0_0_1px_rgba(74,58,168,0.45),0_0_28px_-2px_rgba(74,58,168,0.5),0_0_70px_-10px_rgba(57,43,130,0.45)] backdrop-blur-xl transition placeholder:text-muted focus:border-[#5a47d6]/70 focus:outline-none focus:shadow-[0_0_0_1px_rgba(90,71,214,0.6),0_0_36px_0_rgba(74,58,168,0.6),0_0_90px_-8px_rgba(57,43,130,0.55)]"
        />
        <button
          type="submit"
          aria-label="Run research"
          className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_0_16px_-2px_rgba(109,91,255,0.7)] transition-colors hover:bg-accent-hover"
        >
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
      </form>

      <div className="flex flex-col gap-3 text-left">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Popular searches
        </span>
        <div className="flex flex-wrap gap-2.5">
          {POPULAR_SEARCHES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => runResearch(label)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-foreground/80 backdrop-blur-md transition-colors hover:border-accent/40 hover:bg-white/[0.06] hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
