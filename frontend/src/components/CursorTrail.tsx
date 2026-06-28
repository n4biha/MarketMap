"use client";

import { useEffect, useRef } from "react";

/**
 * Global cursor effect: purple comet particles that spawn at the cursor and
 * drift + fade, leaving a short glittering tail. Additive-blended over the dark
 * UI, pointer-events-none, requestAnimationFrame-driven (no React re-renders per
 * move). Skips touch devices and respects prefers-reduced-motion.
 */
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // No cursor trail on touch devices or when reduced motion is requested.
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let parts: { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number }[] = [];
    let lastSpawn = 0;
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastSpawn < 16) return;
      lastSpawn = now;
      for (let i = 0; i < 2; i++) {
        parts.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6 + 0.25,
          life: 0,
          max: 500 + Math.random() * 400,
          r: 1 + Math.random() * 2,
        });
      }
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    let prev = performance.now();
    const loop = (now: number) => {
      const dt = now - prev;
      prev = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      parts = parts.filter((p) => p.life < p.max);
      for (const p of parts) {
        p.life += dt;
        p.x += p.vx * dt * 0.06;
        p.y += p.vy * dt * 0.06;
        const k = 1 - p.life / p.max;
        ctx.fillStyle = `rgba(165,135,255,${(k * 0.8).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * k + 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
    />
  );
}
