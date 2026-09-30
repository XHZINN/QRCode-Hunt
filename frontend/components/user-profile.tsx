"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { toast } from "sonner"
import { QrCode, Edit3, Check, Star, Zap, LogOut, Medal, Pin, X, ScanFace } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiFetch, getStoredUser, salvarSessao, limparSessao } from "@/lib/api"
import { gsap, ScrollTrigger, useGSAP, haptic, prefersReducedMotion } from "@/lib/gsap"
import { CountUp, InitialsBlock } from "@/components/itw/brand"
import { StripeBundle } from "@/components/itw/decor"
import { PrimaryButton, SectionHeader } from "@/components/itw/ui"
import { Sheet } from "@/components/itw/sheet"

interface MedalhaUsuario {
  id_medalha: string
  nome: string
  descricao: string
  imagem_base64: string
  conquistado_em: string
}

export function UserProfile() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ qrCodesFound: 0, totalPoints: 0, ranking: "-", nivel: 1 })
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [medalhas, setMedalhas] = useState<MedalhaUsuario[]>([])
  const [favMedalhas, setFavMedalhas] = useState<string[]>([]) // até 3 ids
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [meuQrUrl, setMeuQrUrl] = useState<string | null>(null)
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [isLoadingQr, setIsLoadingQr] = useState(false)

  useEffect(() => {
    const parsedUser = getStoredUser()
    if (parsedUser) {
      setUser(parsedUser)
      setEditedName(parsedUser.nome)

      // Carrega favoritos salvos
      const savedFavs = localStorage.getItem(`favMedalhas_${parsedUser.id_user}`)
      if (savedFavs) setFavMedalhas(JSON.parse(savedFavs))

      async function fetchData() {
        try {
          const [posicaoRes, medalhasRes] = await Promise.all([
            apiFetch(`/usuarios/me/posicao`),
            apiFetch(`/usuarios/me/medalhas`),
          ])
          if (posicaoRes.ok) {
            const posicaoData = await posicaoRes.json()
            setStats({
              qrCodesFound: posicaoData.qrs_capturados || 0,
              totalPoints: posicaoData.pontos || 0,
              ranking: String(posicaoData.posicao),
              nivel: posicaoData.nivel || 1
            })
          }
          if (medalhasRes.ok) {
            const mData = await medalhasRes.json()
            setMedalhas(mData || [])
            // Remove favoritas que apontam pra medalhas que não existem mais (ex: apagadas no admin)
            const ids = new Set((mData || []).map((m: MedalhaUsuario) => m.id_medalha))
            setFavMedalhas(prev => {
              const next = prev.filter(id => ids.has(id))
              if (next.length !== prev.length) localStorage.setItem(`favMedalhas_${parsedUser.id_user}`, JSON.stringify(next))
              return next
            })
          }
        } catch (e) {
          console.error("Erro ao carregar perfil:", e)
        }
      }
      fetchData()
    }
  }, [])

  const handleLogout = () => {
    limparSessao()
    window.location.reload()
  }

  const handleSalvarNome = async () => {
    if (!editedName.trim() || editedName === user.nome) {
      setIsEditing(false)
      return
    }
    try {
      const res = await apiFetch(`/usuarios/me/nome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ nome: editedName }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      // Atualiza estado local e localStorage (mantém o token já salvo)
      const novoUser = { ...user, nome: data.nome }
      setUser(novoUser)
      const token = localStorage.getItem("auth_token")
      if (token) salvarSessao(novoUser, token)
    } catch {
      toast.error("Erro ao salvar nome. Tente novamente.")
      setEditedName(user.nome) // reverte
    }
    setIsEditing(false)
  }

  const handleAbrirMeuQrCode = async () => {
    setIsQrOpen(true)
    if (meuQrUrl) return
    setIsLoadingQr(true)
    try {
      const res = await apiFetch(`/usuarios/me/qrcode`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      setMeuQrUrl(URL.createObjectURL(blob))
    } catch {
      toast.error("Erro ao carregar seu QR Code. Tente novamente.")
      setIsQrOpen(false)
    } finally {
      setIsLoadingQr(false)
    }
  }

  const toggleFavMedalha = (id: string) => {
    setFavMedalhas(prev => {
      let next: string[]
      if (prev.includes(id)) {
        next = prev.filter(x => x !== id)
      } else if (prev.length < 3) {
        next = [...prev, id]
      } else {
        next = prev // já tem 3
      }
      localStorage.setItem(`favMedalhas_${user?.id_user}`, JSON.stringify(next))
      return next
    })
  }

  const favMedalhaObjs = favMedalhas.map(id => medalhas.find(m => m.id_medalha === id)).filter(Boolean) as MedalhaUsuario[]

  if (!user) return null

  return (
    <ProfileView
      user={user}
      stats={stats}
      medalhas={medalhas}
      favMedalhas={favMedalhas}
      favMedalhaObjs={favMedalhaObjs}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
      editedName={editedName}
      setEditedName={setEditedName}
      onSalvarNome={handleSalvarNome}
      onLogout={handleLogout}
      onAbrirQr={handleAbrirMeuQrCode}
      toggleFavMedalha={toggleFavMedalha}
      isSelectorOpen={isSelectorOpen}
      setIsSelectorOpen={setIsSelectorOpen}
      isQrOpen={isQrOpen}
      setIsQrOpen={setIsQrOpen}
      isLoadingQr={isLoadingQr}
      meuQrUrl={meuQrUrl}
    />
  )
}

/* ───────────────────────────── visual ───────────────────────────── */

function ProfileView({
  user,
  stats,
  medalhas,
  favMedalhas,
  favMedalhaObjs,
  isEditing,
  setIsEditing,
  editedName,
  setEditedName,
  onSalvarNome,
  onLogout,
  onAbrirQr,
  toggleFavMedalha,
  isSelectorOpen,
  setIsSelectorOpen,
  isQrOpen,
  setIsQrOpen,
  isLoadingQr,
  meuQrUrl,
}: {
  user: any
  stats: { qrCodesFound: number; totalPoints: number; ranking: string; nivel: number }
  medalhas: MedalhaUsuario[]
  favMedalhas: string[]
  favMedalhaObjs: MedalhaUsuario[]
  isEditing: boolean
  setIsEditing: (v: boolean) => void
  editedName: string
  setEditedName: (v: string) => void
  onSalvarNome: () => void
  onLogout: () => void
  onAbrirQr: () => void
  toggleFavMedalha: (id: string) => void
  isSelectorOpen: boolean
  setIsSelectorOpen: (v: boolean) => void
  isQrOpen: boolean
  setIsQrOpen: (v: boolean) => void
  isLoadingQr: boolean
  meuQrUrl: string | null
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [confirmLogout, setConfirmLogout] = useState(false)

  useEffect(() => {
    if (!confirmLogout) return
    const t = setTimeout(() => setConfirmLogout(false), 3000)
    return () => clearTimeout(t)
  }, [confirmLogout])

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".badge-card", { y: 30, rotateX: 12, opacity: 0, duration: 1, ease: "expo.out", transformPerspective: 800 })
      gsap.from("[data-reveal]", { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, ease: "expo.out", delay: 0.15 })
    },
    { scope: ref },
  )

  useGSAP(
    () => {
      if (prefersReducedMotion() || !medalhas.length) return
      const items = gsap.utils.toArray<HTMLElement>("[data-medal]")
      gsap.set(items, { opacity: 0, scale: 0.8 })
      ScrollTrigger.batch(items, {
        start: "top 95%",
        once: true,
        onEnter: (b) => gsap.to(b, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: "back.out(2)" }),
      })
    },
    { scope: ref, dependencies: [medalhas.length] },
  )

  const bars = useMemo(() => barcode(String(user.id_user ?? user.email ?? user.nome)), [user])

  return (
    <div ref={ref} className="space-y-6">
      {/* Crachá */}
      <div className="badge-card relative overflow-hidden border border-line-strong bg-surface">
        <div className="h-[3px] bg-crimson" />
        <StripeBundle lines={5} className="right-[76px] top-0 h-20 opacity-50" />

        <div className="flex items-center justify-between px-5 pt-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="text-white">IT-WORKS</span> <span className="text-crimson">//</span> participante
          </p>
          <button
            onClick={() => (confirmLogout ? onLogout() : setConfirmLogout(true))}
            className={cn(
              "relative z-10 flex h-9 items-center gap-2 border px-2.5 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors",
              confirmLogout ? "border-crimson bg-crimson text-white" : "border-line-strong text-muted-foreground",
            )}
            aria-label={confirmLogout ? "Confirmar saída" : "Sair da conta"}
          >
            <LogOut className="h-3.5 w-3.5" />
            {confirmLogout ? "sair?" : ""}
          </button>
        </div>

        <div className="flex items-start gap-4 px-5 pb-5 pt-4">
          <div className="relative">
            <InitialsBlock name={user.nome} tone="cyan" className="h-[76px] w-[76px] text-2xl" />
            <span className="absolute -bottom-2 -right-2 bg-crimson px-1.5 py-0.5 font-display text-[11px] font-black text-white">
              #{stats.ranking}
            </span>
          </div>

          <div className="min-w-0 flex-1 pt-1">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSalvarNome()}
                  className="h-10 w-full min-w-0 border border-cyan bg-surface-2 px-3 text-base text-white outline-none"
                  aria-label="Novo nome"
                />
                <button onClick={onSalvarNome} aria-label="Salvar nome" className="flex h-10 w-10 shrink-0 items-center justify-center bg-cyan text-ink active:scale-90">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </button>
                <button
                  onClick={() => {
                    setEditedName(user.nome)
                    setIsEditing(false)
                  }}
                  aria-label="Cancelar"
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-line-strong text-muted-foreground active:scale-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="group flex max-w-full items-center gap-2 text-left" aria-label="Editar nome">
                <h2 className="line-clamp-2 font-display text-xl font-black uppercase leading-tight tracking-tight text-white">{user.nome}</h2>
                <Edit3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-active:text-cyan" />
              </button>
            )}
            <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">{user.email}</p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-white px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-wider text-ink">
              <Zap className="h-3 w-3" /> Nível {stats.nivel}
            </div>
          </div>
        </div>

        {/* Medalhas favoritas */}
        <div className="flex items-center gap-2 border-t border-dashed border-line-strong px-5 py-3">
          <span className="mr-auto font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Destaques</span>
          {[0, 1, 2].map((i) => {
            const m = favMedalhaObjs[i]
            return (
              <MedalThumb key={i} medalha={m} className="h-10 w-10" empty={!m} onClick={() => medalhas.length > 0 && setIsSelectorOpen(true)} />
            )
          })}
        </div>

        {/* Código de barras decorativo */}
        <div className="flex items-end justify-between gap-4 bg-surface-2 px-5 py-3">
          <div aria-hidden className="flex h-8 items-stretch gap-[2px]">
            {bars.map((w, i) => (
              <span key={i} className="bg-white/80" style={{ width: w }} />
            ))}
          </div>
          <button
            onClick={onAbrirQr}
            className="notch-sm flex h-10 items-center gap-2 bg-cyan px-3.5 font-display text-[11px] font-black uppercase tracking-wider text-ink active:scale-95"
          >
            <ScanFace className="h-4 w-4" /> Meu QR
          </button>
        </div>
      </div>

      {/* Stats */}
      <div data-reveal className="grid grid-cols-2 gap-2">
        <StatCard icon={<QrCode className="h-4 w-4" />} label="QRs lidos" value={stats.qrCodesFound} accent="text-cyan" />
        <StatCard icon={<Star className="h-4 w-4" />} label="Pontos" value={stats.totalPoints} accent="text-crimson" countUp />
        <StatCard icon={<Zap className="h-4 w-4" />} label="Nível" value={stats.nivel} accent="text-white" />
        <StatCard icon={<Medal className="h-4 w-4" />} label="Medalhas" value={medalhas.length} accent="text-gold" />
      </div>

      {/* Mural de Medalhas */}
      <section data-reveal className="space-y-3">
        <SectionHeader
          kicker="coleção"
          title="Mural de medalhas"
          action={
            medalhas.length > 0 && (
              <button
                onClick={() => setIsSelectorOpen(true)}
                className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan active:opacity-60"
              >
                <Pin className="h-3 w-3" /> Favoritas
              </button>
            )
          }
        />

        {medalhas.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border border-dashed border-line-strong px-4 py-8 text-center">
            <Medal className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhuma medalha ainda.
              <br />
              Escaneie QR Codes para colecionar.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {medalhas.map((m) => {
              const isFav = favMedalhas.includes(m.id_medalha)
              return (
                <button
                  key={m.id_medalha}
                  data-medal
                  onClick={() => {
                    haptic(8)
                    toggleFavMedalha(m.id_medalha)
                  }}
                  aria-pressed={isFav}
                  title={isFav ? "Remover dos favoritos" : favMedalhas.length < 3 ? "Adicionar aos favoritos" : "Já tem 3 favoritas"}
                  className={cn(
                    "relative flex flex-col items-center gap-2 border px-2 pb-3 pt-4 transition-colors active:scale-[0.97]",
                    isFav ? "border-gold/60 bg-gold/[0.06]" : "border-line bg-surface",
                  )}
                >
                  {isFav && <Pin className="absolute right-1.5 top-1.5 h-3 w-3 text-gold" />}
                  <MedalThumb medalha={m} className="h-14 w-14" highlight={isFav} />
                  <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-white">{m.nome}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Sheet: Seletor de Favoritas */}
      <Sheet
        open={isSelectorOpen}
        onOpenChange={setIsSelectorOpen}
        kicker="destaques"
        title="Medalhas favoritas"
        description="Escolha até 3 para exibir no seu crachá."
      >
        <div className="flex justify-center gap-4 py-2">
          {[0, 1, 2].map((i) => (
            <MedalThumb key={i} medalha={favMedalhaObjs[i]} empty={!favMedalhaObjs[i]} className="h-16 w-16" highlight={!!favMedalhaObjs[i]} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {medalhas.map((m) => {
            const isFav = favMedalhas.includes(m.id_medalha)
            const disabled = !isFav && favMedalhas.length >= 3
            return (
              <button
                key={m.id_medalha}
                onClick={() => !disabled && toggleFavMedalha(m.id_medalha)}
                disabled={disabled}
                aria-pressed={isFav}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 border p-2.5 transition-colors",
                  isFav ? "border-gold bg-gold/10" : "border-line bg-surface-2",
                  disabled && "opacity-30",
                )}
              >
                {isFav && <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-gold" strokeWidth={3} />}
                <MedalThumb medalha={m} className="h-11 w-11" />
                <span className="line-clamp-2 text-center text-[10px] font-semibold leading-tight">{m.nome}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-5">
          <PrimaryButton onClick={() => setIsSelectorOpen(false)}>Confirmar ({favMedalhas.length}/3)</PrimaryButton>
        </div>
      </Sheet>

      {/* Sheet: Meu QR Code pessoal */}
      <Sheet
        open={isQrOpen}
        onOpenChange={setIsQrOpen}
        kicker="networking"
        title="Meu QR Code"
        description="Mostre pra um amigo escanear no modo “QR de amigo” — os dois ganham pontos."
      >
        <div className="relative mx-auto my-3 aspect-square w-full max-w-[280px] p-3">
          <span aria-hidden className="hud-corners absolute inset-0" style={{ "--s": "28px", "--w": "3px" } as React.CSSProperties} />
          <div className="flex h-full w-full items-center justify-center bg-white p-3">
            {isLoadingQr && (
              <div className="flex flex-col items-center gap-2">
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <span key={i} className="h-3 w-3 animate-pulse bg-ink" style={{ animationDelay: `${(i % 4) * 0.15}s` }} />
                  ))}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60">gerando</p>
              </div>
            )}
            {!isLoadingQr && meuQrUrl && <img src={meuQrUrl} alt="Meu QR Code pessoal" className="h-full w-full object-contain" />}
          </div>
        </div>
        <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          dica: aumente o brilho da tela
        </p>
      </Sheet>
    </div>
  )
}

function MedalThumb({
  medalha,
  className,
  empty,
  highlight,
  onClick,
}: {
  medalha?: MedalhaUsuario
  className?: string
  empty?: boolean
  highlight?: boolean
  onClick?: () => void
}) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "notch-sm flex shrink-0 items-center justify-center overflow-hidden",
        empty ? "border border-dashed border-line-strong bg-transparent" : "bg-surface-2",
        highlight && "ring-2 ring-gold ring-offset-2 ring-offset-surface",
        className,
      )}
      aria-label={medalha?.nome ?? (onClick ? "Escolher medalhas favoritas" : undefined)}
    >
      {medalha ? (
        medalha.imagem_base64 ? (
          <img src={medalha.imagem_base64} alt={medalha.nome} className="h-full w-full object-cover" />
        ) : (
          <Medal className="h-1/2 w-1/2 text-gold" />
        )
      ) : (
        <span className="text-lg leading-none text-muted-foreground/50">+</span>
      )}
    </Comp>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
  countUp,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
  countUp?: boolean
}) {
  return (
    <div className="flex items-center gap-3 border border-line bg-surface px-4 py-3.5">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center bg-surface-2", accent)}>{icon}</span>
      <div className="min-w-0">
        <p className="truncate font-display text-xl font-black leading-none text-white">
          {countUp ? <CountUp value={value} /> : value.toLocaleString("pt-BR")}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

/** Barras pseudo-aleatórias estáveis a partir de um texto (enfeite do crachá). */
function barcode(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return Array.from({ length: 28 }, (_, i) => {
    h = Math.imul(h ^ (h >>> 13), 1274126177) + i
    return 1 + (Math.abs(h) % 3)
  })
}
