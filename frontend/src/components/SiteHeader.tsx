import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Global top bar: brand lockup top-left, an optional right-side `action`
 * (button/chip/etc.) top-right. Rendered per-screen so each page supplies its own
 * action. Transparent (no divider) so it floats over the dark background.
 */
export function SiteHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="relative z-20 w-full">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          aria-label="MarketMap — back to start"
          className="rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <Logo />
        </Link>
        {action}
      </div>
    </header>
  );
}
