"use client"

import { useState, useEffect } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { QrCode, X, CheckCircle, AlertTriangle, ShieldCheck, Zap } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nexpgames.onrender.com"

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pointsGained, setPointsGained] = useState(0)

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null

    if (isScanning && !scanned) {
      html5QrCode = new Html5Qrcode("reader")
      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }

      html5QrCode.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
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
  }, [isScanning, scanned])

  const handleSuccessfulScan = async (decodedText: string, scanner: any) => {
    try {
      const savedUser = localStorage.getItem("user_nexp")
      if (!savedUser) throw new Error("Usuário não logado")

      const user = JSON.parse(savedUser)
      const userId = String(user.id_user || user.id)

      if (scanner) await scanner.stop()

      // ✅ Extrai só o hash, independente do QR ter URL ou hash puro
      // "https://qr-code-hunt.vercel.app/scan/b9d255d7e70c" → "b9d255d7e70c"
      // "b9d255d7e70c" → "b9d255d7e70c"
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

      if (response.ok && data.status === "Sucesso") {
        setPointsGained(data.pontos)
        setScanned(true)
        setTimeout(() => {
          setIsScanning(false)
          setScanned(false)
        }, 3000)
      } else {
        throw new Error(data.msg || "Erro na validação.")
      }
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => {
        setError(null)
        setIsScanning(false)
      }, 5000)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {!isScanning ? (
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
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Zap size={20}/></div>
              <p className="text-xs font-medium">Aponte para o QR Code para ganhar pontos instantâneos.</p>
            </div>
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border">
              <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><ShieldCheck size={20}/></div>
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
      ) : (
        <div className="relative w-full max-w-sm aspect-square">
          <div id="reader" className="w-full h-full rounded-3xl overflow-hidden bg-black shadow-2xl" />

          {!scanned && !error && (
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

          {scanned && (
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center z-20 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-black text-green-500 uppercase italic">Capturado!</h3>
              <p className="text-xl font-bold">+{pointsGained} PONTOS</p>
              <p className="text-muted-foreground text-[10px] mt-4 uppercase tracking-widest">Sincronizando com o ranking...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-red-600/95 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center z-30 p-6 text-center animate-in fade-in">
              <AlertTriangle className="w-16 h-16 text-white mb-4" />
              <h3 className="text-xl font-black text-white uppercase">Falha na Captura</h3>
              <p className="text-white/90 text-sm font-medium mt-2">{error}</p>
              <Button onClick={() => { setError(null); setIsScanning(true) }} variant="outline" className="mt-6 border-white text-white hover:bg-white/10">
                Tentar Novamente
              </Button>
            </div>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsScanning(false)}
            className="absolute -top-14 right-0 text-muted-foreground hover:text-white"
          >
            <X size={32} />
          </Button>
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
