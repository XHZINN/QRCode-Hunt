"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { gsap, prefersReducedMotion } from "@/lib/gsap"
import { EVENT } from "@/lib/event"

/** Wordmark grande "IT- / WORKS" do poster. */
export function Wordmark({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn("select-none", className)}>
      <h1 className="font-display font-black uppercase leading-[0.86] text-white">
        <span data-wm className="block text-[clamp(64px,22vw,112px)] tracking-[-0.02em]">IT-</span>
        <span data-wm className="block text-[clamp(56px,19vw,98px)] tracking-[-0.02em]">WORKS</span>
      </h1>
      {subtitle && (
        <p data-wm className="font-display mt-2 text-[clamp(11px,3.4vw,15px)] font-bold uppercase tracking-[0.08em] text-cyan text-glow-cyan">
          {EVENT.school}
        </p>
      )}
    </div>
  )
}

/** Versão compacta para o header. */
export function WordmarkInline({ className }: { className?: string }) {
  return (
    <span className={cn("font-display font-black uppercase leading-none tracking-tight text-white", className)}>
      IT<span className="text-crimson">-</span>WORKS
    </span>
  )
}

/**
 * Logo da Software House. Se existir /public/logos/software-house.png,
 * usa o arquivo original; senão, desenha a versão vetorial abaixo.
 */
export function SoftwareHouseLogo({ className }: { className?: string }) {
  const [png, setPng] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.onload = () => setPng(true)
    img.src = "/logos/software-house.png"
  }, [])

  if (png) {
    return <img src="/logos/software-house.png" alt="Software House UNDB" className={cn("object-contain", className)} />
  }

  return (
    <svg viewBox="240 290 1100 1060" className={className} role="img" aria-label="Software House UNDB">
      <defs>
        <linearGradient id="sh-hex" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff2e9a" />
          <stop offset="0.5" stopColor="#9a4fd8" />
          <stop offset="1" stopColor="#3f73d6" />
        </linearGradient>
        <linearGradient id="sh-acc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7ff5e4" />
          <stop offset="1" stopColor="#1f8fff" />
        </linearGradient>
        <filter id="sh-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="46" filter="url(#sh-glow)">
        {/* hexágono externo, aberto embaixo */}
        <path d="M630 1150 L412 1025 L412 578 L805 355 L1192 578 L1192 1015 L818 1238" stroke="url(#sh-hex)" />
        {/* hexágono interno, aberto em cima à direita */}
        <path d="M905 590 L803 530 L565 667 L565 950 L803 1088 L1040 950 L1040 760" stroke="url(#sh-hex)" />
        {/* traços de circuito */}
        <path d="M385 490 L535 405" stroke="url(#sh-acc)" />
        <path d="M1040 345 L1288 488 L1288 720" stroke="url(#sh-acc)" />
        <path d="M302 895 L302 1078 L382 1128" stroke="url(#sh-acc)" />
        <path d="M935 1300 L1085 1214" stroke="url(#sh-acc)" />
        {/* SH */}
        <path d="M758 765 L650 765 L650 822 L738 822 L738 885 L645 885" stroke="#ff2e9a" strokeWidth="34" strokeLinecap="butt" strokeLinejoin="miter" />
        <path d="M782 760 L782 890 M960 760 L960 890 M782 825 L960 825" stroke="#e24cc4" strokeWidth="34" strokeLinecap="butt" />
      </g>
      <g filter="url(#sh-glow)">
        <circle cx="905" cy="598" r="34" fill="#ff2e9a" />
        <circle cx="630" cy="1150" r="34" fill="#ff2e9a" />
        <circle cx="1040" cy="345" r="36" fill="#2aa3ff" />
        <circle cx="302" cy="895" r="36" fill="#7ff5e4" />
      </g>
    </svg>
  )
}

/** Número que conta até o valor com GSAP (formatado em pt-BR). */
export function CountUp({ value, duration = 1.2, className, prefix = "" }: { value: number; duration?: number; className?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fmt = (n: number) => prefix + Math.round(n).toLocaleString("pt-BR")
    if (prefersReducedMotion()) {
      current.current = value
      el.textContent = fmt(value)
      return
    }
    const obj = { v: current.current }
    const tween = gsap.to(obj, {
      v: value,
      duration,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = fmt(obj.v)
      },
      onComplete: () => {
        current.current = value
      },
    })
    return () => {
      tween.kill()
      current.current = obj.v
    }
  }, [value, duration, prefix])

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}0
    </span>
  )
}

/** Avatar quadrado com iniciais — sem bolinhas, no estilo "crachá". */
export function InitialsBlock({ name, className, tone = "cyan" }: { name?: string; className?: string; tone?: "cyan" | "crimson" | "gold" | "silver" | "bronze" | "muted" }) {
  const initials =
    name
      ?.trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??"
  const tones: Record<string, string> = {
    cyan: "bg-cyan text-ink",
    crimson: "bg-crimson text-white",
    gold: "bg-gold text-ink",
    silver: "bg-[#c9ccd6] text-ink",
    bronze: "bg-[#d98a4e] text-ink",
    muted: "bg-surface-2 text-foreground border border-line-strong",
  }
  return (
    <div className={cn("notch-sm flex shrink-0 items-center justify-center font-display font-black", tones[tone], className)}>
      {initials}
    </div>
  )
}
