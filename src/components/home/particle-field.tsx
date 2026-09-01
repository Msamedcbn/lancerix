"use client";

import { useEffect, useRef } from "react";

/**
 * A quiet constellation, not a firework. Dots drift and the nearest ones link
 * — a network settling, which is the right metaphor for an escrow platform
 * and the wrong one for confetti. Canvas, not DOM nodes: a hundred divs each
 * getting their own transform is how a particle field turns into a frame-rate
 * problem.
 */
export function ParticleField({
  className = "",
  count = 46,
}: Readonly<{ className?: string; count?: number }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Dot = { x: number; y: number; vx: number; vy: number; r: number };
    let dots: Dot[] = [];

    function seed() {
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        r: Math.random() * 1.3 + 0.5,
      }));
    }

    function resize() {
      const parent = canvas!.parentElement;
      width = parent?.clientWidth ?? window.innerWidth;
      height = parent?.clientHeight ?? window.innerHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const LINK_DIST = 130;
    let raf = 0;

    function frame() {
      ctx!.clearRect(0, 0, width, height);

      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > width) d.vx *= -1;
        if (d.y < 0 || d.y > height) d.vy *= -1;
      }

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i]!;
          const b = dots[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx!.strokeStyle = `rgba(140, 180, 255, ${0.14 * (1 - dist / LINK_DIST)})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      for (const d of dots) {
        ctx!.beginPath();
        ctx!.fillStyle = "rgba(190, 210, 255, 0.55)";
        ctx!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    if (reduce) {
      // A still frame communicates the same texture without a running loop.
      frame();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${className}`}
    />
  );
}
