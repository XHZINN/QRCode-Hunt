"use client"

import { useEffect, useRef, useState } from "react"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiFetch, getStoredUser } from "@/lib/api"
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap"
import { InitialsBlock } from "@/components/itw/brand"
import { Kicker, XMarks } from "@/components/itw/decor"
import { SkeletonRows } from "@/components/itw/ui"

interface Player {
  id: number | string
  name: string
  score: number
  nivel: number
  qrCodesFound: number
  position: number
}

interface MinhaPosicao {
  posicao: number
  pontos: number
  nivel: number
}

/** Tela completa de ranking: pódio + lista + sua posição. Faz uma única chamada a /ranking. */
export function RankingScreen() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [eu, setEu] = useState<MinhaPosicao | null>(null)
  const meuId = String(getStoredUser()?.id_user ?? "")

  useEffect(() => {
    async function loadRanking() {
      try {
        const [response, posRes] = await Promise.all([apiFetch(`/ranking`), apiFetch(`/usuarios/me/posicao`)])
        const data = await response.json()

        const formattedPlayers = (Array.isArray(data) ? data : []).map((user: any, index: number) => ({
          id: user.id || index,
          name: user.nome || "Anônimo",
          score: user.pontos || 0,
          nivel: user.nivel || 1,
          qrCodesFound: user.qrs_capturados || 0,
          position: index + 1,
        }))
        setPlayers(formattedPlayers)

        if (posRes.ok) setEu(await posRes.json())
      } catch (error) {
        console.error("Erro ao carregar ranking:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadRanking()
  }, [])

  const hasPodium = players.length >= 3
  const rest = hasPodium ? players.slice(3) : players
  const euNaLista = players.some((p) => String(p.id) === meuId)

  return (
    <div className="space-y-6">
      <div className="relative">
        <Kicker>leaderboard</Kicker>
        <h2 className="mt-2 font-display text-[34px] font-black uppercase leading-none tracking-tight text-white">
          Ranking<span className="text-crimson">.</span>
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Os melhores caçadores do IT-WORKS.</p>
        <XMarks vertical={false} size={12} className="absolute right-0 top-1" />
      </div>

      {isLoading ? (
        <SkeletonRows rows={6} />
      ) : players.length === 0 ? (
        <div className="border border-dashed border-line-strong px-4 py-10 text-center text-sm text-muted-foreground">
          O placar ainda está vazio.
          <br />
          Escaneie o primeiro QR e crave seu nome aqui.
        </div>
      ) : (
        <>
          {hasPodium && <Podium top={players.slice(0, 3)} meuId={meuId} />}
          {rest.length > 0 && <RankingList players={rest} meuId={meuId} />}
        </>
      )}

      {!isLoading && eu && !euNaLista && (
        <div className="sticky bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+12px)] z-10">
          <div className="notch flex h-14 items-center gap-3 bg-cyan px-4 text-ink">
            <span className="font-display text-lg font-black">#{eu.posicao}</span>
            <span className="flex-1 font-display text-xs font-black uppercase tracking-wider">Você</span>
            <span className="font-mono text-[10px] font-bold uppercase">Nv {eu.nivel}</span>
            <span className="font-mono text-sm font-bold tabular-nums">{(eu.pontos ?? 0).toLocaleString("pt-BR")} pts</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function RankingList({ players, meuId }: { players: Player[]; meuId?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const rows = gsap.utils.toArray<HTMLElement>("[data-row]")
      gsap.set(rows, { opacity: 0, x: -18 })
      ScrollTrigger.batch(rows, {
        start: "top 95%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, x: 0, duration: 0.6, stagger: 0.05, ease: "expo.out" }),
      })
    },
    { scope: ref, dependencies: [players.length] },
  )

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex items-center gap-3 px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="w-7 text-center">#</span>
        <span className="flex-1">Jogador</span>
        <span className="w-10 text-center">Nv</span>
        <span className="w-16 text-right">Pts</span>
      </div>

      {players.map((player) => {
        const isMe = meuId && String(player.id) === meuId
        return (
          <div
            key={player.id}
            data-row
            className={cn(
              "flex h-14 items-center gap-3 border px-3",
              isMe ? "border-cyan bg-cyan/[0.07]" : "border-line bg-surface",
            )}
          >
            <span className="w-7 text-center font-display text-sm font-black text-muted-foreground">
              {String(player.position).padStart(2, "0")}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <InitialsBlock name={player.name} tone={isMe ? "cyan" : "muted"} className="h-8 w-8 text-[10px]" />
              <span className="truncate text-sm font-semibold text-white">{player.name}</span>
              {isMe && <span className="shrink-0 bg-cyan px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase text-ink">você</span>}
            </div>
            <span className="w-10 text-center font-mono text-xs font-semibold text-cyan">{player.nivel}</span>
            <span className="w-16 text-right font-mono text-xs font-bold tabular-nums text-white">{player.score.toLocaleString("pt-BR")}</span>
          </div>
        )
      })}
    </div>
  )
}

const PODIUM = [
  { idx: 1, h: 92, color: "#c9ccd6", tone: "silver" as const },
  { idx: 0, h: 128, color: "var(--gold)", tone: "gold" as const },
  { idx: 2, h: 68, color: "#d98a4e", tone: "bronze" as const },
]

export function TopThreePodium({ top, meuId }: { top: Player[]; meuId?: string }) {
  return <Podium top={top} meuId={meuId} />
}

function Podium({ top, meuId }: { top: Player[]; meuId?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
      tl.from(".pod-bar", { scaleY: 0, transformOrigin: "bottom", duration: 1, stagger: { each: 0.12, from: "center" } })
        .from(".pod-head", { y: -24, opacity: 0, duration: 0.7, stagger: { each: 0.1, from: "center" } }, 0.35)
        .from(".pod-crown", { y: -16, rotate: -20, opacity: 0, duration: 0.8, ease: "back.out(3)" }, 0.8)
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="grid grid-cols-3 items-end gap-2 pt-4">
      {PODIUM.map(({ idx, h, color, tone }) => {
        const p = top[idx]
        const first = idx === 0
        const isMe = meuId && String(p.id) === meuId
        return (
          <div key={idx} className="flex min-w-0 flex-col items-center">
            <div className="pod-head flex w-full min-w-0 flex-col items-center">
              {first && <Crown className="pod-crown mb-1 h-6 w-6 text-gold" strokeWidth={2.2} />}
              <InitialsBlock name={p.name} tone={tone} className={cn(first ? "h-16 w-16 text-lg" : "h-12 w-12 text-sm")} />
              <span className="mt-2 w-full truncate px-1 text-center text-xs font-semibold text-white">
                {isMe ? "Você" : p.name.split(" ")[0]}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{p.score.toLocaleString("pt-BR")} pts</span>
            </div>
            <div
              className="pod-bar relative mt-2 flex w-full items-start justify-center border-t-[3px] bg-surface pt-2"
              style={{ height: h, borderColor: color }}
            >
              <span className="relative z-10 font-display text-3xl font-black" style={{ color }}>
                {idx + 1}
              </span>
              <span aria-hidden className="bg-grid absolute inset-0 opacity-50" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
