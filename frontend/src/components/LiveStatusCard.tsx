import type { Agent } from "@/components/AgentPipeline";

/**
 * "Live status" card: a pulsing accent "Active" dot, the current agent's name,
 * and its status checklist (first line in-progress, the rest pending).
 */
export function LiveStatusCard({ agent }: { agent: Agent }) {
  return (
    <div className="glow-card w-full max-w-2xl animate-[fadeIn_0.45s_ease] rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        <span className="text-sm font-medium text-foreground">Active</span>
        <span className="text-sm text-muted">· {agent.name} is working</span>
      </div>

      <ul className="space-y-3">
        {agent.statusLines.map((line, i) => (
          <li key={line} className="flex items-center gap-3 text-sm">
            {i === 0 ? (
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent shadow-[0_0_8px_rgba(109,91,255,0.8)]" />
            ) : (
              <span className="h-2 w-2 shrink-0 rounded-full border border-border" />
            )}
            <span className={i === 0 ? "text-foreground" : "text-muted"}>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
