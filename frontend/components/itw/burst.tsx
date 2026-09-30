"use client"

import { useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap"

const PALETTE = ["var(--cyan)", "var(--crimson)", "#ffffff", "var(--gold)"]

/** Explosão de pixels quadrados a partir do centro — usada nas comemorações. */
export function PixelBurst({ count = 28, colors = PALETTE, className }: { count?: number; colors?: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const pixels = useMemo(
    () => Array.from({ length: count }, (_, i) => ({ c: colors[i % colors.length], s: 4 + ((i * 7) % 3) * 3 })),
    [count, colors],
  )

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.utils.toArray<HTMLElement>(".px").forEach((el) => {
        const a = Math.random() * Math.PI * 2
        const d = 70 + Math.random() * 110
        gsap.fromTo(
          el,
          { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 },
          {
            x: Math.cos(a) * d,
            y: Math.sin(a) * d + 30,
            rotate: gsap.utils.random(-180, 180),
            opacity: 0,
            scale: 0.4,
            duration: gsap.utils.random(0.8, 1.4),
            ease: "power3.out",
            delay: Math.random() * 0.12,
          },
        )
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none absolute left-1/2 top-1/2 h-0 w-0", className)}>
      {pixels.map((p, i) => (
        <span
          key={i}
          className="px absolute opacity-0"
          style={{ width: p.s, height: p.s, background: p.c, left: -p.s / 2, top: -p.s / 2 }}
        />
      ))}
    </div>
  )
}
