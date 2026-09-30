"use client"

import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function PrimaryButton({
  children,
  loading,
  className,
  tone = "cyan",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; tone?: "cyan" | "crimson" | "white" }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        "notch group relative flex h-14 w-full items-center justify-center gap-3 font-display text-[13px] font-black uppercase tracking-[0.14em] transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-40",
        tone === "cyan" && "bg-cyan text-ink",
        tone === "crimson" && "bg-crimson text-white",
        tone === "white" && "bg-white text-ink",
        className,
      )}
    >
      {loading ? (
        <span className="flex items-center gap-1.5" aria-label="Processando">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2 w-2 animate-pulse bg-current" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </span>
      ) : (
        <>
          {children}
          <ArrowRight className="h-4 w-4 transition-transform group-active:translate-x-1" />
        </>
      )}
    </button>
  )
}

/** Painel de superfície com borda fina e, opcionalmente, cantoneiras de mira. */
export function Panel({
  children,
  className,
  corners = false,
  cornerColor,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { corners?: boolean; cornerColor?: string }) {
  return (
    <div {...props} className={cn("relative border border-line bg-surface", className)}>
      {corners && (
        <span
          aria-hidden
          className="hud-corners pointer-events-none absolute -inset-px"
          style={cornerColor ? ({ "--c": cornerColor } as React.CSSProperties) : undefined}
        />
      )}
      {children}
    </div>
  )
}

/** Cabeçalho de seção: rótulo mono + título + ação opcional. */
export function SectionHeader({
  kicker,
  title,
  action,
  className,
}: {
  kicker?: string
  title: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {kicker && (
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan">
            <span className="opacity-60">// </span>
            {kicker}
          </p>
        )}
        <h2 className="mt-1 font-display text-lg font-black uppercase leading-none tracking-tight text-white">{title}</h2>
      </div>
      {action}
    </div>
  )
}

/** Blocos de carregamento no estilo do app. */
export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-label="Carregando" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex h-14 items-center gap-3 border border-line bg-surface px-3" style={{ opacity: 1 - i * 0.14 }}>
          <div className="h-8 w-8 animate-pulse bg-surface-2" />
          <div className="h-3 flex-1 animate-pulse bg-surface-2" />
          <div className="h-3 w-12 animate-pulse bg-surface-2" />
        </div>
      ))}
    </div>
  )
}
