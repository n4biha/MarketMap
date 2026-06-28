import { Fragment } from "react";
import { Check, FileText, LineChart, Search, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Agent {
  name: string;
  description: string;
  icon: LucideIcon;
  statusLines: string[];
}

// The 4-agent pipeline, in order. `statusLines` drive the Live status card.
export const AGENTS: Agent[] = [
  {
    name: "Scout",
    description: "Scanning the web and collecting market signals",
    icon: Search,
    statusLines: [
      "Scanning industry and news sources",
      "Analyzing user needs and pain points",
      "Evaluating competitor positioning",
      "Identifying white space opportunities",
    ],
  },
  {
    name: "Analyst",
    description: "Extracting key patterns and insights",
    icon: LineChart,
    statusLines: [
      "Indexing the collected sources",
      "Extracting recurring pain points",
      "Clustering competitor insights",
      "Summarizing the market landscape",
    ],
  },
  {
    name: "Strategist",
    description: "Evaluating opportunities and market potential",
    icon: Target,
    statusLines: [
      "Scoring the market opportunity",
      "Mapping white-space gaps",
      "Weighing risks and trade-offs",
      "Choosing the sharpest angle",
    ],
  },
  {
    name: "Formatter",
    description: "Crafting a concise research brief",
    icon: FileText,
    statusLines: [
      "Assembling the brief",
      "Formatting key takeaways",
      "Finalizing competitor cards",
      "Polishing the summary",
    ],
  },
];

type StageStatus = "complete" | "active" | "upcoming";

const CIRCLE: Record<StageStatus, string> = {
  active:
    "border-accent bg-accent/25 text-[#bcb0ff] shadow-[0_0_0_5px_rgba(109,91,255,0.25),0_0_50px_-2px_rgba(109,91,255,0.95),0_0_120px_-12px_rgba(109,91,255,0.6)]",
  complete: "border-accent/40 bg-accent/10 text-accent",
  upcoming: "border-border bg-card text-muted",
};

function StageNode({ agent, status }: { agent: Agent; status: StageStatus }) {
  const Icon = agent.icon;
  return (
    <div className="flex w-36 flex-col items-center gap-3 px-1 text-center">
      <div
        className={`relative flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-700 ease-out ${CIRCLE[status]}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
        {status === "active" && (
          <>
            <span className="absolute inset-[-9px] animate-ping rounded-full bg-accent/20" />
            <span className="absolute inset-[-6px] animate-pulse rounded-full ring-2 ring-accent/60" />
          </>
        )}
        {status === "complete" && (
          <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-background bg-accent text-accent-foreground">
            <Check className="h-3 w-3" aria-hidden />
          </span>
        )}
      </div>
      <div>
        <p
          className={`text-sm font-semibold ${status === "upcoming" ? "text-muted" : "text-foreground"}`}
        >
          {agent.name}
        </p>
        <p className="mt-1 text-xs leading-snug text-muted">{agent.description}</p>
      </div>
    </div>
  );
}

/**
 * The 4-stage agent pipeline with dotted connectors. `activeIndex` drives the
 * state: stages before it are complete, the one at it is active (glowing), the
 * rest upcoming. Connectors already traversed glow accent.
 */
export function AgentPipeline({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex w-full max-w-4xl items-start justify-between">
      {AGENTS.map((agent, i) => {
        const status: StageStatus =
          i < activeIndex ? "complete" : i === activeIndex ? "active" : "upcoming";
        return (
          <Fragment key={agent.name}>
            <StageNode agent={agent} status={status} />
            {i < AGENTS.length - 1 && (
              <div className="relative mt-7 h-0 flex-1" aria-hidden>
                {/* dim base track */}
                <div className="absolute inset-x-0 top-0 border-t-2 border-dotted border-border/70" />
                {/* accent fill that grows as progress passes this connector */}
                <div
                  className="absolute left-0 top-0 border-t-2 border-dotted border-accent/80 transition-[width] duration-700 ease-out"
                  style={{ width: i < activeIndex ? "100%" : "0%" }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
