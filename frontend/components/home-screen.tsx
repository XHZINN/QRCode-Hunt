"use client"

import { useEffect, useRef, useState } from "react"
import { QrCode, Trophy, ArrowRight, ScanLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiFetch, getStoredUser } from "@/lib/api"
import { levelProgress } from "@/lib/level"
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap"
import { CountUp, InitialsBlock } from "@/components/itw/brand"
import { EventTicker, Kicker, StripeBundle } from "@/components/itw/decor"
import { Panel, SectionHeader, SkeletonRows } from "@/components/itw/ui"

interface HomeScreenProps {
  onNavigate: (tab: string) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [userData, setUserData] = useState<any>(null)
  const [topPlayers, setTopPlayers] = useState<any[]>([])
  const [playersLoaded, setPlayersLoaded] = useState(false)
  const [stats, setStats] = useState({
    qrCodes: "--",
    ranking: "--"
  })
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parsedUser = getStoredUser()
    if (parsedUser) {
      setUserData(parsedUser)

      async function loadData() {
        try {
          // Busca separados: top 3 para exibição e posição real do usuário logado
          const [rankingRes, posicaoRes] = await Promise.all([
            apiFetch(`/ranking?limit=3`),
            apiFetch(`/usuarios/me/posicao`),
          ])

          const rankingData = await rankingRes.json()
          setTopPlayers(Array.isArray(rankingData) ? rankingData : [])

          if (posicaoRes.ok) {
            const posicaoData = await posicaoRes.json()
            setStats({
              qrCodes: String(posicaoData.qrs_capturados ?? "0"),
              ranking: `#${posicaoData.posicao}`
            })
            setUserData((prev: any) => ({ ...prev, pontos: posicaoData.pontos, nivel: posicaoData.nivel }))
          }
        } catch (error) {
          console.error("Erro ao carregar dados da Home:", error)
        } finally {
          setPlayersLoaded(true)
        }
      }
      loadData()
    }
  }, [])

  const pontos = Number(userData?.pontos) || 0
  const progress = levelProgress(pontos)
  const nivel = userData?.nivel ?? progress.nivel
  const firstName = (userData?.nome || "Explorador").trim().split(/\s+/)[0]

  // Entrada em sequência + mira animada no botão de scan
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from("[data-reveal]", { y: 26, opacity: 0, duration: 0.8, stagger: 0.08, ease: "expo.out", delay: 0.05 })
      gsap.fromTo(".reticle-line", { y: 0 }, { y: 50, duration: 1.6, repeat: -1, ease: "sine.inOut", yoyo: true })
    },
    { scope: rootRef },
  )

  // Barra de nível preenche quando os pontos chegam
  useGSAP(
    () => {
      const segs = gsap.utils.toArray<HTMLElement>(".lvl-seg.is-on")
      if (!segs.length || prefersReducedMotion()) return
      gsap.fromTo(segs, { scaleY: 0 }, { scaleY: 1, duration: 0.4, stagger: 0.025, ease: "back.out(2)", transformOrigin: "bottom" })
    },
    { scope: rootRef, dependencies: [pontos] },
  )

  const SEGMENTS = 20
  const filled = Math.round(progress.pct * SEGMENTS)

  return (
    <div ref={rootRef} className="space-y-7">
      {/* Saudação */}
      <section data-reveal>
        <Kicker>bem-vindo(a) de volta</Kicker>
        <h1 className="mt-2 truncate font-display text-[40px] font-black uppercase leading-none tracking-tight text-white">
          {firstName}
          <span className="text-crimson">.</span>
        </h1>
      </section>

      {/* Card de XP */}
      <Panel data-reveal corners className="overflow-hidden p-5">
        <StripeBundle lines={5} className="-top-2 right-4 h-28 opacity-70" />

        <div className="relative flex items-start justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Total de pontos</p>
          <div className="notch-sm bg-white px-2.5 py-1 font-display text-[11px] font-black uppercase tracking-wider text-ink">
            LVL {String(nivel).padStart(2, "0")}
          </div>
        </div>

        <div className="relative mt-1 flex items-baseline gap-2">
          <CountUp value={pontos} className="font-display text-[56px] font-black leading-none text-white" />
          <span className="font-display text-sm font-bold uppercase text-cyan">pts</span>
        </div>

        {/* Barra de nível em pixels */}
        <div className="mt-4">
          <div className="flex h-3 gap-[3px]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress.pct * 100)} aria-label="Progresso para o próximo nível">
            {Array.from({ length: SEGMENTS }).map((_, i) => (
              <span key={i} className={cn("lvl-seg flex-1", i < filled ? "is-on bg-cyan" : "bg-surface-2")} />
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            faltam <span className="text-white">{progress.faltam.toLocaleString("pt-BR")}</span> pts pro nível {progress.nivel + 1}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 border-t border-line pt-4">
          <QuickStat icon={<QrCode className="h-4 w-4" />} value={stats.qrCodes} label="QRs lidos" />
          <QuickStat icon={<Trophy className="h-4 w-4" />} value={stats.ranking} label="Posição" divider />
        </div>
      </Panel>

      {/* Botão de Scan */}
      <button
        data-reveal
        onClick={() => onNavigate("scan")}
        className="notch group relative flex w-full items-center gap-4 overflow-hidden bg-cyan p-5 text-left text-ink transition-transform duration-150 active:scale-[0.98]"
      >
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-ink">
          <span aria-hidden className="hud-corners absolute inset-1.5" style={{ "--s": "10px" } as React.CSSProperties} />
          <QrCode className="h-7 w-7 text-cyan" />
          <span aria-hidden className="reticle-line absolute inset-x-1.5 top-1 h-[2px] bg-crimson shadow-[0_0_10px_var(--crimson)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-black uppercase leading-none tracking-tight">Escanear agora</p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">abrir câmera de captura</p>
        </div>
        <ArrowRight className="h-6 w-6 shrink-0 transition-transform group-active:translate-x-1" />
      </button>

      <div data-reveal className="-mx-4">
        <EventTicker />
      </div>

      {/* Ranking */}
      <section data-reveal className="space-y-3">
        <SectionHeader
          kicker="leaderboard"
          title="Top jogadores"
          action={
            <button
              onClick={() => onNavigate("ranking")}
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan active:opacity-60"
            >
              Ver tudo <ArrowRight className="h-3 w-3" />
            </button>
          }
        />

        {!playersLoaded ? (
          <SkeletonRows rows={3} />
        ) : topPlayers.length === 0 ? (
          <div className="flex items-center gap-3 border border-dashed border-line-strong px-4 py-5 text-sm text-muted-foreground">
            <ScanLine className="h-5 w-5 text-cyan" />
            Ninguém pontuou ainda. Seja o primeiro!
          </div>
        ) : (
          <div className="space-y-2">
            {topPlayers.map((player, index) => (
              <LeaderCard key={index} position={index + 1} name={player.nome} points={player.pontos} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function QuickStat({ icon, value, label, divider }: { icon: React.ReactNode; value: string; label: string; divider?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", divider && "border-l border-line pl-4")}>
      <div className="flex items-center gap-2 text-cyan">
        {icon}
        <span className="font-display text-2xl font-black leading-none text-white">{value}</span>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
    </div>
  )
}

const MEDAL_TONE = ["gold", "silver", "bronze"] as const
const MEDAL_TEXT = ["text-gold", "text-[#c9ccd6]", "text-[#d98a4e]"]

function LeaderCard({ position, name, points }: { position: number; name: string; points: number }) {
  return (
    <div className="flex h-14 items-center gap-3 border border-line bg-surface pr-4">
      <span className={cn("w-11 text-center font-display text-lg font-black", MEDAL_TEXT[position - 1] || "text-muted-foreground")}>
        {String(position).padStart(2, "0")}
      </span>
      <InitialsBlock name={name} tone={MEDAL_TONE[position - 1] || "muted"} className="h-8 w-8 text-[11px]" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{name}</span>
      <span className="font-mono text-xs font-semibold tabular-nums text-cyan">{(points ?? 0).toLocaleString("pt-BR")}</span>
    </div>
  )
}
