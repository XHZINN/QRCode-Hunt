"use client"

import { useState, useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { QrCode, X, CheckCircle, AlertTriangle, ShieldCheck, Zap, Medal, Timer, Trophy } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nexpgames.onrender.com"

interface Pergunta {
  id_pergunta: string
  enunciado: string
  tipo: "multipla_escolha" | "verdadeiro_falso"
  alternativas: Record<string, string>
}

interface ScanResult {
  pontos_qr: number
  pergunta: Pergunta | null
  medalha_conquistada: boolean
}

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
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
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

    if (isScanning && !scanResult && !error) {
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
  }, [isScanning, scanResult, error])

  const handleSuccessfulScan = async (decodedText: string, scanner: any) => {
    try {
      const savedUser = localStorage.getItem("user_nexp")
      if (!savedUser) throw new Error("Usuário não logado")

      const user = JSON.parse(savedUser)
      const userId = String(user.id_user || user.id)

      if (scanner) await scanner.stop()

      const codeHash = decodedText.startsWith("http")
        ? decodedText.split("/").pop() ?? decodedText
        : decodedText

      const formData = new URLSearchParams()
      formData.append("user_id", userId)
      formData.append("code_hash", codeHash)

      const response = await fetch(`${API_URL}/capturar`, {
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
          pergunta: perguntaParaExibir,
          medalha_conquistada: medalha,
        })
        setIsScanning(false)

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
        throw new Error(data.msg || "Erro na validação.")
      }
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => {
        isProcessingRef.current = false
        setError(null)
        setIsScanning(false)
      }, 5000)
    }
  }

  const handleResponder = async () => {

    if (!respostaSelecionada || !pergunta || !scanResult) return
    const savedUser = localStorage.getItem("user_nexp")
    if (!savedUser) return

    const user = JSON.parse(savedUser)
    const userId = String(user.id_user || user.id)
    const tempoSegundos = Math.floor((Date.now() - tempoInicioRef.current) / 1000)
    
    const fd = new URLSearchParams()
    fd.append("user_id", userId)
    fd.append("id_pergunta", pergunta.id_pergunta)
    fd.append("resposta", respostaSelecionada)
    fd.append("tempo_segundos", String(tempoSegundos))

    try {
      const res = await fetch(`${API_URL}/responder`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: fd.toString(),
      })
      const data = await res.json()

      // Persiste localmente que esta pergunta foi respondida
      markQuestionAnswered(userId, pergunta.id_pergunta)

      setRespondido(true)
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
    setPergunta(null)
    setRespostaSelecionada(null)
    setRespondido(false)
    setFeedbackPergunta(null)
    setError(null)
    setIsScanning(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Estado inicial */}
      {!isScanning && !scanResult && !error && (
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-card border-2 border-primary/50 rounded-3xl p-5 shadow-2xl">
                <QrCode className="w-full h-full text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase">Scanner Ativo</h2>
              <p className="text-muted-foreground text-sm">Encontre pontos de captura pela UNDB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Zap size={20} /></div>
              <p className="text-xs font-medium">Aponte para o QR Code para ganhar pontos instantâneos.</p>
            </div>
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><ShieldCheck size={20} /></div>
              <p className="text-xs font-medium">Cada código é único e validado em tempo real.</p>
            </div>
          </div>

          <Button
            onClick={() => setIsScanning(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-8 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:scale-[1.02] active:scale-95"
          >
            ABRIR CÂMERA DE CAPTURA
          </Button>
        </div>
      )}

      {/* Câmera ativa */}
      {isScanning && !scanResult && !error &&(
        <div className="relative w-full max-w-sm aspect-square">
          <div id="reader" className="w-full h-full rounded-3xl overflow-hidden bg-black shadow-2xl" />
          {!error && (
            <>
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-secondary rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-secondary rounded-br-3xl" />
                <div className="absolute left-8 right-8 h-[2px] bg-primary/40 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_10px_cyan]" />
              </div>
              <div className="absolute -bottom-10 left-0 right-0 text-center">
                <p className="text-[10px] font-bold text-primary animate-pulse tracking-[0.2em] uppercase">Sistema de Reconhecimento Ativo</p>
              </div>
            </>
          )}
          <Button size="icon" variant="ghost" onClick={() => setIsScanning(false)} className="absolute -top-14 right-0 text-muted-foreground hover:text-white">
            <X size={32} />
          </Button>
        </div>
      )}

      {/* Scan success overlay */}
      {scanResult && !pergunta && (
        <div className="w-full max-w-sm animate-in zoom-in duration-300 space-y-4">
          <div className="bg-card border border-green-500/40 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-black text-green-500 uppercase italic">Capturado!</h3>
            <p className="text-xl font-bold">+{scanResult.pontos_qr} PONTOS</p>

            {scanResult.medalha_conquistada && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
                <Medal className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-400">Medalha conquistada!</span>
              </div>
            )}

            {scanResult.pergunta && (
              <p className="text-muted-foreground text-xs animate-pulse">Preparando pergunta bônus...</p>
            )}

            {!scanResult.pergunta && (
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Sincronizando com o ranking...</p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Pergunta */}
      {pergunta && !respondido && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-card border border-primary/40 rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-cyan-400">Pergunta Bônus</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                <Timer className="w-3 h-3" />
                {tempoDecorrido}s
                {tempoDecorrido <= 10 && <span className="text-green-400 ml-1 font-bold">⚡</span>}
              </div>
            </div>

            <p className="font-bold text-base leading-snug">{pergunta.enunciado}</p>

            <div className={`grid gap-2 ${pergunta.tipo === "multipla_escolha" ? "grid-cols-1" : "grid-cols-2"}`}>
              {Object.entries(pergunta.alternativas).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setRespostaSelecionada(key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold text-left transition-all ${
                    respostaSelecionada === key
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-muted/20 hover:border-primary/50 text-foreground"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${respostaSelecionada === key ? "bg-primary text-black" : "bg-muted text-muted-foreground"}`}>
                    {key}
                  </span>
                  {val}
                </button>
              ))}
            </div>

            <Button
              onClick={handleResponder}
              disabled={!respostaSelecionada}
              className="w-full bg-gradient-to-r from-primary to-secondary text-black font-black py-5 rounded-xl disabled:opacity-40"
            >
              CONFIRMAR RESPOSTA
            </Button>

            <p className="text-center text-[10px] text-muted-foreground">
              {tempoDecorrido <= 10 ? "⚡ Resposta rápida = pontos máximos!" : "Resposta ainda vale pontos parciais."}
            </p>
          </div>
        </div>
      )}

      {/* Feedback da pergunta */}
      {respondido && feedbackPergunta && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-sm rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl animate-in zoom-in duration-300 ${
            feedbackPergunta.acertou
              ? "bg-card border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]"
              : "bg-card border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${feedbackPergunta.acertou ? "bg-green-500" : "bg-red-500"}`}>
              {feedbackPergunta.acertou
                ? <CheckCircle className="w-12 h-12 text-white" />
                : <AlertTriangle className="w-12 h-12 text-white" />}
            </div>

            <div className="text-center space-y-1">
              <h3 className={`text-2xl font-black uppercase ${feedbackPergunta.acertou ? "text-green-500" : "text-red-400"}`}>
                {feedbackPergunta.acertou ? "Acertou! 🎉" : "Errou!"}
              </h3>
              {feedbackPergunta.acertou
                ? <p className="text-xl font-bold">+{feedbackPergunta.pontos_bonus} pts bônus</p>
                : <p className="text-sm text-muted-foreground">Resposta correta: <span className="font-black text-foreground">{feedbackPergunta.resposta_correta}</span></p>}
            </div>

            <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Voltando ao scanner...</p>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="w-full max-w-sm">
          <div className="bg-red-600/95 rounded-3xl p-8 flex flex-col items-center text-center gap-4">
            <AlertTriangle className="w-16 h-16 text-white" />
            <h3 className="text-xl font-black text-white uppercase">Falha na Captura</h3>
            <p className="text-white/90 text-sm font-medium">{error}</p>
            <Button onClick={resetScanner} variant="outline" className="border-white text-white hover:bg-white/10">
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}

      <style jsx global>{`
        #reader { border: none !important; }
        #reader__status_span { display: none !important; }
        #reader__dashboard { display: none !important; }
        #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        @keyframes scan {
          0%, 100% { top: 15%; opacity: 0.2; }
          50% { top: 85%; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
