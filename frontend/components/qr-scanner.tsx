"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { QrCode, X, Check, AlertTriangle, ShieldCheck, Zap, Medal, Timer, Users, TrendingUp, Camera } from "lucide-react"
import { apiFetch, getStoredUser } from "@/lib/api"
import { cn } from "@/lib/utils"
import { gsap, useGSAP, haptic, prefersReducedMotion } from "@/lib/gsap"
import { CountUp } from "@/components/itw/brand"
import { Kicker, XMarks, StripeBundle } from "@/components/itw/decor"
import { PixelBurst } from "@/components/itw/burst"
import { PrimaryButton, Panel } from "@/components/itw/ui"

interface Pergunta {
  id_pergunta: string
  enunciado: string
  tipo: "multipla_escolha" | "verdadeiro_falso"
  alternativas: Record<string, string>
}

interface ScanResult {
  pontos_qr: number
  nivel_atual: number
  subiu_de_nivel: boolean
  pergunta: Pergunta | null
  medalha_conquistada: boolean
}

interface FriendScanResult {
  amigo: string
  pontos_ganho: number
  pontos_total: number
  nivel_anterior: number
  nivel_atual: number
  subiu_de_nivel: boolean
}

type ModoScan = "evento" | "amigo"

// --- Cache local de perguntas já respondidas (por usuário) ---
function getAnsweredQuestions(userId: string): string[] {
  try {
    const saved = localStorage.getItem(`answered_questions_${userId}`)
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

function markQuestionAnswered(userId: string, questionId: string) {
  try {
    const current = getAnsweredQuestions(userId)
    if (!current.includes(questionId)) {
      localStorage.setItem(
        `answered_questions_${userId}`,
        JSON.stringify([...current, questionId])
      )
    }
  } catch {}
}

function isQuestionAlreadyAnswered(userId: string, questionId: string): boolean {
  return getAnsweredQuestions(userId).includes(questionId)
}

export function QRScanner() {
  const [modoScan, setModoScan] = useState<ModoScan>("evento")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [friendResult, setFriendResult] = useState<FriendScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Question modal states
  const [pergunta, setPergunta] = useState<Pergunta | null>(null)
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [respondido, setRespondido] = useState(false)
  const [feedbackPergunta, setFeedbackPergunta] = useState<{ acertou: boolean; pontos_bonus: number; resposta_correta: string } | null>(null)
  const tempoInicioRef = useRef<number>(0)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)

  // Guard contra callbacks duplicados do html5QrCode (o scanner pode disparar
  // onScanSuccess mais de uma vez antes do stop() assíncrono completar)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    if (!pergunta || respondido) return
    tempoInicioRef.current = Date.now()
    setTempoDecorrido(0)
    const interval = setInterval(() => {
      setTempoDecorrido(Math.floor((Date.now() - tempoInicioRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [pergunta, respondido])

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null

    if (isScanning && !scanResult && !friendResult && !error) {
      html5QrCode = new Html5Qrcode("reader")
      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          // Ignora se já está processando um scan — evita chamadas duplicadas
          if (isProcessingRef.current) return
          isProcessingRef.current = true
          handleSuccessfulScan(decodedText, html5QrCode)
        },
        () => {}
      ).catch(() => setError("Câmera não encontrada ou permissão negada."))
    }

    return () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().catch(() => {})
      }
    }
  }, [isScanning, scanResult, friendResult, error])

  const handleSuccessfulScan = async (decodedText: string, scanner: any) => {
    try {
      if (scanner) await scanner.stop()

      const codeHash = decodedText.startsWith("http")
        ? decodedText.split("/").pop() ?? decodedText
        : decodedText

      if (modoScan === "amigo") {
        await handleScanAmigo(codeHash)
        return
      }

      const user = getStoredUser()
      const userId = String(user?.id_user || user?.id || "")

      const formData = new URLSearchParams()
      formData.append("code_hash", codeHash)

      const response = await apiFetch(`/capturar`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      })

      const data = await response.json()

      // Sucesso normal OU a API indicou que a pergunta já foi respondida
      // (algumas APIs retornam status diferente nesse caso — tratamos ambos)
      const perguntaJaRespondidaPelaApi =
        !response.ok &&
        (data.status === "pergunta_ja_respondida" ||
          (data.msg && /pergunta.*(j[aá]).*respondid/i.test(data.msg)))

      if ((response.ok && data.status === "Sucesso") || perguntaJaRespondidaPelaApi) {
        const pontos = data.pontos_qr ?? 0
        const medalha = data.medalha_conquistada ?? false

        // Verifica se a pergunta já foi respondida — seja via cache local
        // ou porque a API sinalizou isso explicitamente
        const perguntaRecebida: Pergunta | null = data.pergunta ?? null
        const perguntaJaRespondidaLocalmente =
          perguntaRecebida !== null &&
          isQuestionAlreadyAnswered(userId, perguntaRecebida.id_pergunta)

        const perguntaParaExibir =
          perguntaRecebida === null ||
          perguntaJaRespondidaPelaApi ||
          perguntaJaRespondidaLocalmente
            ? null
            : perguntaRecebida

        setScanResult({
          pontos_qr: pontos,
          nivel_atual: data.nivel_atual ?? 1,
          subiu_de_nivel: data.subiu_de_nivel ?? false,
          pergunta: perguntaParaExibir,
          medalha_conquistada: medalha,
        })
        setIsScanning(false)
        haptic([18, 40, 18])

        if (perguntaParaExibir) {
          // Pergunta nova: exibe o modal após pequeno delay
          setTimeout(() => {
            setPergunta(perguntaParaExibir)
            setTempoDecorrido(0)
          }, 1800)
        } else {
          // Sem pergunta (captura simples ou pergunta já respondida): volta ao início após 3s
          setTimeout(() => {
            isProcessingRef.current = false
            setScanResult(null)
          }, 3000)
        }
      } else {
        throw new Error(data.detail || "Erro na validação.")
      }
    } catch (err: any) {
      setError(err.message)
      haptic([60, 40, 60])
      setTimeout(() => {
        isProcessingRef.current = false
        setError(null)
        setIsScanning(false)
      }, 5000)
    }
  }

  const handleScanAmigo = async (codeHash: string) => {
    try {
      const formData = new URLSearchParams()
      formData.append("code_hash", codeHash)

      const response = await apiFetch(`/amigos/escanear`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || "Erro ao escanear amigo.")

      setFriendResult(data)
      haptic([18, 40, 18])
      setIsScanning(false)
      setTimeout(() => {
        isProcessingRef.current = false
        setFriendResult(null)
      }, 3500)
    } catch (err: any) {
      setError(err.message)
      haptic([60, 40, 60])
      setTimeout(() => {
        isProcessingRef.current = false
        setError(null)
        setIsScanning(false)
      }, 5000)
    }
  }

  const handleResponder = async () => {
    if (!respostaSelecionada || !pergunta || !scanResult) return
    const user = getStoredUser()
    const userId = String(user?.id_user || user?.id || "")
    const tempoSegundos = Math.floor((Date.now() - tempoInicioRef.current) / 1000)

    const fd = new URLSearchParams()
    fd.append("id_pergunta", pergunta.id_pergunta)
    fd.append("resposta", respostaSelecionada)
    fd.append("tempo_segundos", String(tempoSegundos))

    try {
      const res = await apiFetch(`/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: fd.toString(),
      })
      const data = await res.json()

      // Persiste localmente que esta pergunta foi respondida
      markQuestionAnswered(userId, pergunta.id_pergunta)

      setRespondido(true)
      haptic(data.acertou ? [18, 40, 18] : 90)
      setFeedbackPergunta({ acertou: data.acertou, pontos_bonus: data.pontos_bonus, resposta_correta: data.resposta_correta })

      setTimeout(() => {
        isProcessingRef.current = false
        setPergunta(null)
        setScanResult(null)
        setRespostaSelecionada(null)
        setRespondido(false)
        setFeedbackPergunta(null)
      }, 4000)
    } catch (e) {
      console.error(e)
    }
  }

  const resetScanner = () => {
    isProcessingRef.current = false
    setScanResult(null)
    setFriendResult(null)
    setPergunta(null)
    setRespostaSelecionada(null)
    setRespondido(false)
    setFeedbackPergunta(null)
    setError(null)
    setIsScanning(false)
  }

  const cameraNegada = !!error && /c[aâ]mera|permiss/i.test(error)

  return (
    <div className="flex min-h-[calc(100dvh-var(--nav-h)-150px)] flex-col">
      {/* Estado inicial */}
      {!isScanning && !scanResult && !friendResult && !error && (
        <IdleView modoScan={modoScan} setModoScan={setModoScan} onStart={() => setIsScanning(true)} />
      )}

      {/* Câmera ativa */}
      {isScanning && !scanResult && !friendResult && !error && (
        <CameraView modoScan={modoScan} onClose={() => setIsScanning(false)} />
      )}

      {/* Scan success overlay */}
      {scanResult && !pergunta && (
        <ResultCard tone="cyan" kicker="captura confirmada" title="Capturado!" pontos={scanResult.pontos_qr} sufixo="pontos">
          {scanResult.subiu_de_nivel && (
            <Chip icon={<TrendingUp className="h-4 w-4" />}>Subiu para o nível {scanResult.nivel_atual}!</Chip>
          )}
          {scanResult.medalha_conquistada && <Chip icon={<Medal className="h-4 w-4" />}>Medalha conquistada!</Chip>}
          <StatusLine>
            {scanResult.pergunta ? "preparando pergunta bônus" : "sincronizando com o ranking"}
          </StatusLine>
        </ResultCard>
      )}

      {/* Scan de amigo: sucesso */}
      {friendResult && (
        <ResultCard tone="crimson" kicker="networking" title="Conexão feita!" pontos={friendResult.pontos_ganho} sufixo="pts pra cada um">
          <p className="text-center text-sm text-muted-foreground">
            Você e <span className="font-semibold text-white">{friendResult.amigo}</span> fizeram networking.
          </p>
          {friendResult.subiu_de_nivel ? (
            <Chip icon={<TrendingUp className="h-4 w-4" />}>Subiu para o nível {friendResult.nivel_atual}!</Chip>
          ) : (
            <StatusLine>
              nível {friendResult.nivel_atual} · {friendResult.pontos_total.toLocaleString("pt-BR")} pts totais
            </StatusLine>
          )}
        </ResultCard>
      )}

      {/* Modal de Pergunta */}
      {pergunta && !respondido && (
        <QuestionModal
          pergunta={pergunta}
          tempoDecorrido={tempoDecorrido}
          respostaSelecionada={respostaSelecionada}
          onSelect={(k) => {
            haptic(8)
            setRespostaSelecionada(k)
          }}
          onConfirm={handleResponder}
        />
      )}

      {/* Feedback da pergunta */}
      {respondido && feedbackPergunta && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-5 backdrop-blur-sm">
          <div className="relative w-full max-w-sm">
            {feedbackPergunta.acertou && <PixelBurst count={34} />}
            <Panel corners cornerColor={feedbackPergunta.acertou ? "var(--ok)" : "var(--crimson)"} className="flex flex-col items-center gap-4 px-6 py-10 text-center">
              <div
                className={cn(
                  "notch flex h-20 w-20 items-center justify-center",
                  feedbackPergunta.acertou ? "bg-ok text-ink" : "bg-crimson text-white",
                )}
              >
                {feedbackPergunta.acertou ? <Check className="h-10 w-10" strokeWidth={3} /> : <X className="h-10 w-10" strokeWidth={3} />}
              </div>
              <Kicker tone={feedbackPergunta.acertou ? "cyan" : "crimson"}>pergunta bônus</Kicker>
              <h3 className={cn("font-display text-4xl font-black uppercase", feedbackPergunta.acertou ? "text-ok" : "text-crimson")}>
                {feedbackPergunta.acertou ? "Acertou!" : "Errou!"}
              </h3>
              {feedbackPergunta.acertou ? (
                <p className="font-display text-2xl font-black text-white">
                  <CountUp value={feedbackPergunta.pontos_bonus ?? 0} prefix="+" /> <span className="text-sm text-cyan">pts bônus</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Resposta correta:{" "}
                  <span className="inline-flex h-7 min-w-7 items-center justify-center bg-white px-1.5 font-display font-black text-ink">
                    {feedbackPergunta.resposta_correta}
                  </span>
                </p>
              )}
              <StatusLine>voltando ao scanner</StatusLine>
            </Panel>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="flex flex-1 items-center">
          <Panel corners cornerColor="var(--crimson)" className="w-full overflow-hidden px-6 py-9 text-center">
            <StripeBundle lines={4} className="-top-2 left-5 h-20 opacity-60" />
            <div className="notch mx-auto flex h-16 w-16 items-center justify-center bg-crimson">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <Kicker tone="crimson" className="mt-5">erro</Kicker>
            <h3 className="mt-2 font-display text-2xl font-black uppercase text-white">Falha na captura</h3>
            <p className="mx-auto mt-3 max-w-[280px] text-sm leading-relaxed text-foreground/80">{error}</p>
            {cameraNegada && (
              <p className="mx-auto mt-3 max-w-[280px] border-l-2 border-cyan bg-cyan/5 px-3 py-2 text-left text-xs leading-relaxed text-muted-foreground">
                Libere a câmera nas permissões do navegador (ícone de cadeado ao lado do endereço) e tente de novo.
              </p>
            )}
            <div className="mt-7">
              <PrimaryButton tone="white" onClick={resetScanner}>
                Tentar novamente
              </PrimaryButton>
            </div>
          </Panel>
        </div>
      )}

      <style jsx global>{`
        #reader { border: none !important; }
        #reader__status_span { display: none !important; }
        #reader__dashboard { display: none !important; }
        #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        #qr-shaded-region { border-color: rgba(3, 3, 4, 0.55) !important; }
        #qr-shaded-region > div { display: none !important; }
      `}</style>
    </div>
  )
}

/* ───────────────────────────── subviews ───────────────────────────── */

function IdleView({
  modoScan,
  setModoScan,
  onStart,
}: {
  modoScan: ModoScan
  setModoScan: (m: ModoScan) => void
  onStart: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from("[data-in]", { y: 22, opacity: 0, duration: 0.7, stagger: 0.07, ease: "expo.out" })
      gsap.to(".idle-scan", { y: 118, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" })
    },
    { scope: ref },
  )
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from("[data-tip]", { x: -14, opacity: 0, duration: 0.5, stagger: 0.06, ease: "power3.out" })
    },
    { scope: ref, dependencies: [modoScan] },
  )

  const evento = modoScan === "evento"
  const tips = evento
    ? [
        { icon: <Zap className="h-4 w-4" />, text: "Aponte para o QR Code e ganhe pontos na hora." },
        { icon: <ShieldCheck className="h-4 w-4" />, text: "Cada código é único e validado em tempo real." },
      ]
    : [
        { icon: <Users className="h-4 w-4" />, text: "Escaneie o QR pessoal de alguém — vale uma vez por dupla." },
        { icon: <TrendingUp className="h-4 w-4" />, text: "Os dois ganham pontos e sobem de nível juntos." },
      ]

  return (
    <div ref={ref} className="space-y-6">
      <div data-in className="flex items-start justify-between">
        <div>
          <Kicker>scanner</Kicker>
          <h2 className="mt-2 font-display text-[34px] font-black uppercase leading-none tracking-tight text-white">
            {evento ? "Caçar QR" : "Networking"}
            <span className="text-crimson">.</span>
          </h2>
          <p className="mt-2 max-w-[260px] text-sm text-muted-foreground">
            {evento ? "Encontre os pontos de captura espalhados pela UNDB." : "Conecte com a galera do evento e pontue em dupla."}
          </p>
        </div>
        <XMarks size={13} className="mt-1" />
      </div>

      {/* Ilustração de mira */}
      <div data-in className="relative mx-auto aspect-square w-[62%] max-w-[240px]">
        <span aria-hidden className="hud-corners absolute inset-0" style={{ "--s": "34px", "--w": "3px", "--c": evento ? "var(--cyan)" : "var(--crimson)" } as React.CSSProperties} />
        <div className="absolute inset-[18%] flex items-center justify-center border border-line bg-surface">
          {evento ? <QrCode className="h-1/2 w-1/2 text-white/85" strokeWidth={1.4} /> : <Users className="h-1/2 w-1/2 text-white/85" strokeWidth={1.4} />}
        </div>
        <span
          aria-hidden
          className="idle-scan absolute inset-x-[10%] top-[12%] h-[2px]"
          style={{ background: evento ? "var(--cyan)" : "var(--crimson)", boxShadow: `0 0 14px ${evento ? "var(--cyan)" : "var(--crimson)"}` }}
        />
      </div>

      {/* Seletor de modo */}
      <div data-in className="relative grid grid-cols-2 border border-line-strong bg-surface p-1" role="tablist">
        <span
          aria-hidden
          className={cn(
            "absolute bottom-1 top-1 w-[calc(50%-4px)] transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            evento ? "bg-cyan" : "bg-crimson",
          )}
          style={{ left: 4, transform: `translateX(${evento ? 0 : 100}%)` }}
        />
        {(["evento", "amigo"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modoScan === m}
            onClick={() => {
              haptic(8)
              setModoScan(m)
            }}
            className={cn(
              "relative z-10 flex h-11 items-center justify-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-300",
              modoScan === m ? (m === "evento" ? "text-ink" : "text-white") : "text-muted-foreground",
            )}
          >
            {m === "evento" ? <QrCode className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            {m === "evento" ? "QR do evento" : "QR de amigo"}
          </button>
        ))}
      </div>

      <ul data-in className="space-y-2">
        {tips.map((t, i) => (
          <li key={t.text} data-tip className="flex items-center gap-3 border border-line bg-surface px-4 py-3">
            <span className="font-mono text-[10px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className={evento ? "text-cyan" : "text-crimson"}>{t.icon}</span>
            <p className="text-[13px] leading-snug text-foreground/85">{t.text}</p>
          </li>
        ))}
      </ul>

      <div data-in>
        <PrimaryButton tone={evento ? "cyan" : "crimson"} onClick={onStart}>
          <Camera className="h-4 w-4" /> Abrir câmera
        </PrimaryButton>
      </div>
    </div>
  )
}

function CameraView({ modoScan, onClose }: { modoScan: ModoScan; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from(".cam-frame", { scale: 0.92, opacity: 0, duration: 0.6, ease: "expo.out" })
      gsap.fromTo(".cam-line", { top: "12%" }, { top: "88%", duration: 1.7, repeat: -1, yoyo: true, ease: "sine.inOut" })
    },
    { scope: ref },
  )
  const accent = modoScan === "evento" ? "var(--cyan)" : "var(--crimson)"

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          <span className="h-2 w-2 animate-pulse bg-crimson" />
          rec · modo {modoScan === "evento" ? "evento" : "amigo"}
        </p>
        <button
          onClick={onClose}
          aria-label="Fechar câmera"
          className="flex h-10 w-10 items-center justify-center border border-line-strong text-white active:scale-90"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="cam-frame relative aspect-square w-full">
        <div id="reader" className="h-full w-full overflow-hidden bg-black" />
        <div className="pointer-events-none absolute inset-0 z-10">
          <span className="scanlines absolute inset-0" />
          <span className="hud-corners absolute -inset-1" style={{ "--s": "46px", "--w": "3px", "--c": accent } as React.CSSProperties} />
          <span className="cam-line absolute inset-x-6 h-[2px]" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
          <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/50" />
          <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-white/50" />
        </div>
      </div>

      <p className="text-center font-mono text-[10px] uppercase tracking-[0.25em] text-white/80">
        aponte para o qr code<span className="animate-caret ml-1 inline-block h-3 w-1.5 translate-y-0.5" style={{ background: accent }} />
      </p>
    </div>
  )
}

function ResultCard({
  tone,
  kicker,
  title,
  pontos,
  sufixo,
  children,
}: {
  tone: "cyan" | "crimson"
  kicker: string
  title: string
  pontos: number
  sufixo: string
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
      tl.from(".res-badge", { scale: 0, rotate: -90, duration: 0.8, ease: "back.out(2.2)" })
        .from(".res-item", { y: 16, opacity: 0, duration: 0.6, stagger: 0.07 }, 0.2)
    },
    { scope: ref },
  )
  const color = tone === "cyan" ? "var(--cyan)" : "var(--crimson)"

  return (
    <div ref={ref} className="flex flex-1 items-center">
      <div className="relative w-full">
        <PixelBurst />
        <Panel corners cornerColor={color} className="flex flex-col items-center gap-4 overflow-hidden px-6 py-10">
          <div className={cn("res-badge notch flex h-20 w-20 items-center justify-center", tone === "cyan" ? "bg-cyan text-ink" : "bg-crimson text-white")}>
            {tone === "cyan" ? <Check className="h-10 w-10" strokeWidth={3} /> : <Users className="h-10 w-10" strokeWidth={2.4} />}
          </div>
          <div className="res-item text-center">
            <Kicker tone={tone === "cyan" ? "cyan" : "crimson"}>{kicker}</Kicker>
            <h3 className="mt-2 font-display text-3xl font-black uppercase text-white">{title}</h3>
          </div>
          <p className="res-item font-display text-5xl font-black leading-none" style={{ color }}>
            <CountUp value={pontos ?? 0} prefix="+" duration={1.4} />
          </p>
          <p className="res-item -mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{sufixo}</p>
          <div className="res-item flex w-full flex-col items-center gap-3">{children}</div>
        </Panel>
      </div>
    </div>
  )
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold">
      {icon}
      {children}
    </div>
  )
}

function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-pulse bg-cyan" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </span>
      {children}
    </p>
  )
}

const LIMITE_RAPIDO = 10

function QuestionModal({
  pergunta,
  tempoDecorrido,
  respostaSelecionada,
  onSelect,
  onConfirm,
}: {
  pergunta: Pergunta
  tempoDecorrido: number
  respostaSelecionada: string | null
  onSelect: (k: string) => void
  onConfirm: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rapido = tempoDecorrido <= LIMITE_RAPIDO

  useGSAP(
    () => {
      // barra de tempo: esvazia em 10s (janela de resposta rápida)
      gsap.fromTo(".q-bar", { scaleX: 1 }, { scaleX: 0, duration: LIMITE_RAPIDO, ease: "none", transformOrigin: "left" })
      if (prefersReducedMotion()) return
      gsap.from(".q-in", { y: 24, opacity: 0, duration: 0.6, stagger: 0.06, ease: "expo.out" })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className="fixed inset-0 z-[60] flex flex-col bg-ink/[0.97] backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col overflow-y-auto px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(20px,env(safe-area-inset-top))]">
        <div className="q-in flex items-center justify-between">
          <Kicker>pergunta bônus</Kicker>
          <span
            className={cn(
              "flex items-center gap-1.5 border px-2 py-1 font-mono text-xs tabular-nums",
              rapido ? "border-cyan/40 text-cyan" : "border-crimson/50 text-crimson",
            )}
          >
            <Timer className="h-3.5 w-3.5" />
            {tempoDecorrido}s
          </span>
        </div>

        <div className="q-in mt-3 h-1.5 w-full bg-surface-2">
          <div className={cn("q-bar h-full", rapido ? "bg-cyan" : "bg-crimson")} />
        </div>
        <p className={cn("q-in mt-2 font-mono text-[10px] uppercase tracking-[0.2em]", rapido ? "text-cyan" : "text-muted-foreground")}>
          {rapido ? "⚡ responda rápido = pontos máximos" : "ainda vale pontos parciais"}
        </p>

        <h3 className="q-in mt-6 text-[22px] font-bold leading-snug text-white">{pergunta.enunciado}</h3>

        <div className={cn("q-in mt-6 grid gap-2.5", pergunta.tipo === "multipla_escolha" ? "grid-cols-1" : "grid-cols-2")}>
          {Object.entries(pergunta.alternativas).map(([key, val]) => {
            const sel = respostaSelecionada === key
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                aria-pressed={sel}
                className={cn(
                  "flex min-h-14 items-center gap-3 border p-3 text-left text-[15px] font-medium transition-[border-color,background-color,transform] duration-200 active:scale-[0.98]",
                  sel ? "border-cyan bg-cyan/10 text-white" : "border-line-strong bg-surface text-foreground/90",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center font-display text-sm font-black transition-colors",
                    sel ? "bg-cyan text-ink" : "bg-surface-2 text-muted-foreground",
                  )}
                >
                  {key}
                </span>
                {val}
              </button>
            )
          })}
        </div>

        <div className="q-in mt-auto pt-8">
          <PrimaryButton onClick={onConfirm} disabled={!respostaSelecionada}>
            Confirmar resposta
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
