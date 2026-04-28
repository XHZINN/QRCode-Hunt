"use client"

import { useState, useEffect } from "react"
import { QrCode, Plus, Trash2, Download, LogOut, RotateCw } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HexagonLogo } from "@/components/hexagon-logo"
import { useRouter } from "next/navigation"

interface QRCode {
  code_hash: string;
  local: string;
  pontos: number;
  ativo: boolean;
}

export default function AdminQRManager() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [formData, setFormData] = useState({ name: "", points: 50 })

  const handleLogout = () => {
    localStorage.removeItem("user_nexp")
    router.push("/")
  }

  const handleToggleStatus = async (code_hash: string, currentStatus: boolean) => {
    const action = currentStatus ? "desativar" : "ativar"
    if (!confirm(`Deseja ${action} este QR Code?`)) return

    try {
      const response = await fetch(`/api/qrcodes/status/${code_hash}`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: !currentStatus }),
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        setQrCodes(qrCodes.map(qr =>
          qr.code_hash === code_hash ? { ...qr, ativo: !currentStatus } : qr
        ))
      }
    } catch (error) {
      console.error("Erro ao mudar status:", error)
    }
  }

  useEffect(() => {
    async function checkAdmin() {
      const storedUser = localStorage.getItem("user_nexp")
      if (!storedUser) return router.push("/login")
      const user = JSON.parse(storedUser)

      try {
        const response = await fetch(`/api/usuarios/verificar-admin?email=${user.email}`)
        const data = await response.json()

        if (!data.is_admin) {
          router.push("/")
        } else {
          fetchQRCodes()
          setLoading(false)
        }
      } catch (err) {
        router.push("/login")
      }
    }
    checkAdmin()
  }, [])

  async function fetchQRCodes() {
    try {
      const response = await fetch("/api/qrcodes/listar")
      const data = await response.json()
      setQrCodes(data || [])
    } catch (err) {
      console.error("Erro ao carregar QR Codes:", err)
    }
  }

  const handleGenerate = async () => {
    try {
      // ✅ Rota interna — gera e faz download direto do Next.js
      window.open(`/api/qrcodes/gerar?nome_local=${formData.name}&pontos=${formData.points}`, "_blank")
      setTimeout(fetchQRCodes, 1000)
      setIsCreating(false)
      setFormData({ name: "", points: 50 })
    } catch (error) {
      alert("Erro ao gerar QR Code")
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-white font-bold">
      Verificando permissões...
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <header className="max-w-5xl mx-auto flex justify-between items-center mb-8 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <HexagonLogo size="sm" />
          <h1 className="text-xl font-bold uppercase tracking-wider">
            Painel Admin <span className="text-primary">QR Hunt</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchQRCodes}
            title="Atualizar lista"
            className="hover:text-primary"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Novo QR
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto">
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <QrCode className="text-primary" /> Gerenciamento de QRs
          </h2>

          {qrCodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-10 border border-dashed rounded-xl">
              Nenhum QR Code gerado ainda.
            </p>
          ) : (
            qrCodes.map((qr) => (
              <div
                key={qr.code_hash}
                className={`bg-card border p-4 rounded-xl flex items-center justify-between transition-all ${
                  !qr.ativo ? "opacity-60 grayscale border-dashed" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${qr.ativo ? "bg-primary/10" : "bg-muted"} p-3 rounded-lg`}>
                    <QrCode className={`${qr.ativo ? "text-primary" : "text-muted-foreground"} w-6 h-6`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{qr.local}</h3>
                      {!qr.ativo && (
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-bold">
                          DESATIVADO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{qr.code_hash}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className={`${qr.ativo ? "text-primary" : "text-muted-foreground"} font-bold text-lg`}>
                      +{qr.pontos} pts
                    </span>
                  </div>

                  <div className="flex items-center gap-2 border-l border-border pl-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(qr.code_hash, qr.ativo)}
                      title={qr.ativo ? "Desativar" : "Reativar"}
                      className={qr.ativo ? "hover:text-destructive" : "hover:text-primary"}
                    >
                      {qr.ativo ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </Button>
                    {qr.ativo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(`/api/qrcodes/gerar?nome_local=${qr.local}&pontos=${qr.pontos}`, "_blank")
                        }
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal de Criação */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Gerar Novo QR Code</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Local (Ex: Auditório)</Label>
                <Input
                  placeholder="Nome do local"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor em Pontos</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-primary text-black font-bold"
                  onClick={handleGenerate}
                  disabled={!formData.name}
                >
                  Gerar QR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
