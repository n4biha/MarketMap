"use client";

import { useEffect, useRef } from "react";

/**
 * Premium data-mesh landscape anchored to the bottom of the landing page: a
 * curved 3D-perspective grid of tiny violet points connected by thin low-opacity
 * lines, forming rolling "research terrain". Denser/brighter in the foreground,
 * smaller/fainter toward the horizon; edges glow, the center stays darker so the
 * search UI reads. Drifts and shimmers very subtly.
 *
 * Canvas 2D (DPR-aware for retina), absolutely positioned, pointer-events-none,
 * masked to fade upward. Honors prefers-reduced-motion (renders one static frame).
 */

const COLS = 96; // points across
const ROWS = 50; // points into the distance
const DEPTH = 6; // perspective strength (higher = stronger convergence)
const LATERAL = 1.75; // how far the foreground rows spread past the edges
const FPS = 30; // throttle — the motion is slow, so 30fps keeps it light

// Palette
const C_MAIN = { r: 0x6d, g: 0x5d, b: 0xfb }; // #6D5DFB
const C_EDGE = { r: 0x8b, g: 0x5c, b: 0xf6 }; // #8B5CF6

export function DataMeshWave({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const context = el.getContext("2d");
    if (!context) return;

    // Non-null captures so the nested closures keep the narrowed types.
    const cnv: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = context;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;

    // Per-point random shimmer phase (client-only; never SSR'd).
    const shimmer = new Float32Array(COLS * ROWS);
    for (let i = 0; i < shimmer.length; i++) shimmer[i] = Math.random() * Math.PI * 2;

    // Reused projection buffers.
    const px = new Float32Array(COLS * ROWS);
    const py = new Float32Array(COLS * ROWS);
    const pa = new Float32Array(COLS * ROWS);
    const pr = new Float32Array(COLS * ROWS);

    function resize() {
      const rect = cnv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      cnv.width = Math.max(1, Math.floor(width * dpr));
      cnv.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, width, height);
      const horizonY = height * 0.04;
      const ampPx = height * 0.16; // terrain relief
      const t = time * 0.001;

      for (let zi = 0; zi < ROWS; zi++) {
        const d = zi / (ROWS - 1); // 0 near → 1 far
        const zz = 1 / (1 + d * DEPTH); // perspective scale (1 near → small far)
        const baseY = horizonY + (height - horizonY) * zz;

        for (let xi = 0; xi < COLS; xi++) {
          const idx = zi * COLS + xi;
          const xn = xi / (COLS - 1); // 0..1
          const edge = Math.abs(xn - 0.5) * 2; // 0 center → 1 edge
          const wx = (xn - 0.5) * 2; // -1..1

          // Layered rolling terrain, plus a slow time drift.
          const hill =
            Math.sin(wx * 2.4 + d * 3.2 + t * 0.16) * 0.62 +
            Math.cos(wx * 3.3 - d * 4.5) * 0.36 +
            Math.sin(wx * 5.2 - d * 2.4 + t * 0.1) * 0.28 +
            Math.sin((wx + d) * 7.5) * 0.16 +
            Math.sin(d * 3.0 + t * 0.08) * 0.24;
          const drift = reduce ? 0 : Math.sin(t * 0.6 + shimmer[idx]) * 0.1;
          // Asymmetric: amplify the downward side so dips go deep while the
          // rises stay gentle.
          const sink = hill > 0 ? hill * 2.2 : hill * 0.5;

          px[idx] = width / 2 + wx * width * 0.5 * LATERAL * zz;
          // Inverted (+) so the prominent features sink into dips rather than
          // peaking up like mountains.
          py[idx] = baseY + (sink + drift) * ampPx * zz;

          // Brightness: foreground bright, horizon faint; edges glow, center dim.
          const depthBright = Math.pow(zz, 0.85);
          const centerDim = 0.32 + edge * 0.68;
          let a = depthBright * centerDim;
          if (!reduce) a *= 0.82 + 0.18 * Math.sin(t * 1.3 + shimmer[idx]);
          pa[idx] = a;
          pr[idx] = 0.5 + zz * 2.1; // dot radius (px)
        }
      }

      // Wireframe lines (under the dots).
      ctx.lineWidth = 0.6;
      for (let zi = 0; zi < ROWS; zi++) {
        for (let xi = 0; xi < COLS; xi++) {
          const idx = zi * COLS + xi;
          if (xi < COLS - 1) {
            const n = idx + 1;
            const la = Math.min(pa[idx], pa[n]) * 0.32;
            if (la > 0.012) {
              ctx.strokeStyle = `rgba(123,99,255,${la.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(px[idx], py[idx]);
              ctx.lineTo(px[n], py[n]);
              ctx.stroke();
            }
          }
          if (zi < ROWS - 1) {
            const n = idx + COLS;
            const la = Math.min(pa[idx], pa[n]) * 0.26;
            if (la > 0.012) {
              ctx.strokeStyle = `rgba(109,93,251,${la.toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(px[idx], py[idx]);
              ctx.lineTo(px[n], py[n]);
              ctx.stroke();
            }
          }
        }
      }

      // Dots.
      for (let zi = 0; zi < ROWS; zi++) {
        for (let xi = 0; xi < COLS; xi++) {
          const idx = zi * COLS + xi;
          const a = pa[idx];
          if (a <= 0.02) continue;
          const edge = Math.abs(xi / (COLS - 1) - 0.5) * 2;
          const r = Math.round(C_MAIN.r + (C_EDGE.r - C_MAIN.r) * edge);
          const g = Math.round(C_MAIN.g + (C_EDGE.g - C_MAIN.g) * edge);
          const b = Math.round(C_MAIN.b + (C_EDGE.b - C_MAIN.b) * edge);
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(a, 1).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px[idx], py[idx], pr[idx], 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    let raf = 0;
    let last = 0;
    const interval = 1000 / FPS;
    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      if (now - last < interval) return;
      last = now;
      draw(now);
    }

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(0);
    });
    ro.observe(cnv);

    if (reduce) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[44vh] min-h-[340px] ${className}`}
      style={{
        maskImage: "linear-gradient(to top, #000 0%, #000 32%, transparent 96%)",
        WebkitMaskImage: "linear-gradient(to top, #000 0%, #000 32%, transparent 96%)",
      }}
      aria-hidden
    >
      {/* radial purple glow pooled in the bottom corners */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 95% at 15% 118%, rgba(109,93,251,0.20), transparent 62%), radial-gradient(70% 95% at 85% 118%, rgba(139,92,246,0.17), transparent 62%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
