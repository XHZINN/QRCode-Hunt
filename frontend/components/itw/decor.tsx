"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap"
import { EVENT } from "@/lib/event"

/* Gerador determinístico — as estrelas ficam no mesmo lugar em todo render. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Campo de "estrelas" quadradas em pixel, como no poster. */
export function PixelStars({ count = 28, seed = 7, className }: { count?: number; seed?: number; className?: string }) {
  const stars = useMemo(() => {
    const rnd = mulberry32(seed)
    return Array.from({ length: count }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      s: rnd() > 0.8 ? 4 : rnd() > 0.4 ? 3 : 2,
      d: rnd() * 4,
      o: 0.25 + rnd() * 0.6,
    }))
  }, [count, seed])

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {stars.map((st, i) => (
        <span
          key={i}
          className={cn("absolute bg-white", i % 3 === 0 && "animate-twinkle")}
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            opacity: st.o,
            animationDelay: `${st.d}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Anéis concêntricos (branco + carmim) que giram devagar. */
export function OrbitRings({ className, size = 320 }: { className?: string; size?: number }) {
  const ref = useRef<SVGSVGElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.to(".ring-a", { rotate: 360, duration: 60, repeat: -1, ease: "none", transformOrigin: "50% 50%" })
      gsap.to(".ring-b", { rotate: -360, duration: 90, repeat: -1, ease: "none", transformOrigin: "50% 50%" })
      gsap.to(".ring-c", { rotate: 360, duration: 40, repeat: -1, ease: "none", transformOrigin: "50% 50%" })
    },
    { scope: ref },
  )

  return (
    <svg
      ref={ref}
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={cn("pointer-events-none absolute", className)}
      fill="none"
    >
      <g className="ring-a">
        <circle cx="100" cy="100" r="96" stroke="#f4f4f6" strokeOpacity="0.55" strokeWidth="0.8" strokeDasharray="420 184" />
      </g>
      <g className="ring-b">
        <circle cx="100" cy="100" r="84" stroke="var(--crimson)" strokeWidth="1.6" strokeDasharray="300 228" />
      </g>
      <g className="ring-c">
        <circle cx="100" cy="100" r="70" stroke="#f4f4f6" strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="200 240" />
      </g>
    </svg>
  )
}

/** Feixe de listras verticais carmim que se apagam para baixo. */
export function StripeBundle({ lines = 6, className }: { lines?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute flex gap-[7px]", className)}
      style={{ maskImage: "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 45%, transparent 100%)" }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <span
          key={i}
          className="block h-full w-[2px]"
          style={{ background: i % 2 ? "var(--crimson-deep)" : "color-mix(in srgb, var(--crimson) 70%, var(--crimson-deep))" }}
        />
      ))}
    </div>
  )
}

/** Os três "X" empilhados do poster. */
export function XMarks({ className, size = 22, vertical = true }: { className?: string; size?: number; vertical?: boolean }) {
  const colors = ["var(--crimson)", "#e8e8ec", "var(--crimson)"]
  return (
    <div aria-hidden className={cn("pointer-events-none flex gap-2.5", vertical ? "flex-col" : "flex-row", className)}>
      {colors.map((c, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 10 10">
          <path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" stroke={c} strokeWidth="2.6" strokeLinecap="square" />
        </svg>
      ))}
    </div>
  )
}

/** Faixa rolando com o nome e as datas do evento. */
export function EventTicker({ className }: { className?: string }) {
  const item = (
    <span className="flex shrink-0 items-center gap-4 pr-4">
      <span>{EVENT.name}</span>
      <XGlyph />
      <span className="text-cyan">{EVENT.school}</span>
      <XGlyph />
      <span>{EVENT.dates.join(" · ")}</span>
      <XGlyph />
    </span>
  )
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden border-y border-line py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/70",
        className,
      )}
    >
      <div className="animate-marquee flex w-max">
        {item}
        {item}
        {item}
        {item}
      </div>
    </div>
  )
}

function XGlyph() {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" className="shrink-0">
      <path d="M1 1 L9 9 M9 1 L1 9" stroke="var(--crimson)" strokeWidth="2.4" />
    </svg>
  )
}

/** Texto digitado estilo terminal: <hello world /> */
export function TypeTag({ text, className, delay = 0.3 }: { text: string; className?: string; delay?: number }) {
  const [shown, setShown] = useState(prefersReducedMotion() ? text.length : 0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(text.length)
      return
    }
    setShown(0)
    let i = 0
    let interval: ReturnType<typeof setInterval>
    const start = setTimeout(() => {
      interval = setInterval(() => {
        i++
        setShown(i)
        if (i >= text.length) clearInterval(interval)
      }, 55)
    }, delay * 1000)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [text, delay])

  return (
    <span className={cn("font-mono", className)} aria-label={text}>
      <span aria-hidden>{text.slice(0, shown)}</span>
      <span aria-hidden className="animate-caret ml-0.5 inline-block h-[1em] w-[0.55em] translate-y-[0.15em] bg-cyan" />
    </span>
  )
}

/** Rótulo pequeno em mono com barra, ex: // RANKING */
export function Kicker({ children, className, tone = "cyan" }: { children: React.ReactNode; className?: string; tone?: "cyan" | "crimson" | "muted" }) {
  return (
    <p
      className={cn(
        "font-mono text-[10px] font-medium uppercase tracking-[0.28em]",
        tone === "cyan" && "text-cyan",
        tone === "crimson" && "text-crimson",
        tone === "muted" && "text-muted-foreground",
        className,
      )}
    >
      <span className="opacity-60">// </span>
      {children}
    </p>
  )
}
