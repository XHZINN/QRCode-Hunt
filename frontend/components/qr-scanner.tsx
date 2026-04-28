"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Flashlight, SwitchCamera, QrCode, X, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [scanned, setScanned] = useState(false)

  const handleScan = () => {
    // Simular scan bem-sucedido
    setScanned(true)
    setTimeout(() => {
      setScanned(false)
      setIsScanning(false)
    }, 3000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {!isScanning ? (
        <div className="text-center space-y-6">
          {/* Ícone grande */}
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-3xl opacity-20 blur-xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center glow-cyan">
              <QrCode className="w-16 h-16 text-primary-foreground" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Pronto para caçar?</h2>
            <p className="text-muted-foreground max-w-sm">
              Aponte sua câmera para um QR Code e ganhe pontos incríveis!
            </p>
          </div>

          <Button
            onClick={() => setIsScanning(true)}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold px-8 py-6 glow-cyan"
          >
            <Camera className="w-5 h-5 mr-2" />
            Iniciar Scanner
          </Button>

          {/* Dicas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-lg">
            <TipCard number={1} text="Encontre um QR Code escondido" />
            <TipCard number={2} text="Escaneie com sua câmera" />
            <TipCard number={3} text="Ganhe pontos e suba no ranking!" />
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-sm aspect-square">
          {/* Scanner frame */}
          <div className="absolute inset-0 bg-muted rounded-3xl overflow-hidden">
            {/* Simulação de câmera */}
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Câmera simulada</p>
              </div>
            </div>
          </div>

          {/* Scanner corners */}
          <div className="absolute inset-4 pointer-events-none">
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-secondary rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-secondary rounded-br-2xl" />
          </div>

          {/* Scanning line animation */}
          {!scanned && (
            <div className="absolute left-4 right-4 h-1 bg-gradient-to-r from-primary to-secondary animate-[scan_2s_ease-in-out_infinite] rounded-full glow-cyan" />
          )}

          {/* Success overlay */}
          {scanned && (
            <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center">
              <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-green-500">QR Code Encontrado!</h3>
              <p className="text-green-400 mt-2">+75 pontos</p>
            </div>
          )}

          {/* Controls */}
          <div className="absolute -bottom-16 left-0 right-0 flex items-center justify-center gap-4">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setFlashOn(!flashOn)}
              className={cn(
                "rounded-full w-12 h-12",
                flashOn && "bg-yellow-500/20 border-yellow-500 text-yellow-500"
              )}
            >
              <Flashlight className="w-5 h-5" />
            </Button>
            
            <Button
              size="icon"
              variant="default"
              onClick={handleScan}
              className="rounded-full w-16 h-16 bg-gradient-to-r from-primary to-secondary glow-cyan"
            >
              <QrCode className="w-8 h-8 text-primary-foreground" />
            </Button>
            
            <Button
              size="icon"
              variant="outline"
              className="rounded-full w-12 h-12"
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>
          </div>

          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsScanning(false)}
            className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 1rem; }
          50% { top: calc(100% - 1rem); }
        }
      `}</style>
    </div>
  )
}

function TipCard({ number, text }: { number: number; text: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 text-center">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-2">
        {number}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}
