"use client"

import { useState } from "react"
import { QrCode, MapPin, Star, FileText, Plus, Trash2, Eye, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HexagonLogo } from "@/components/hexagon-logo"
import { cn } from "@/lib/utils"

interface QRCodeData {
  id: string
  name: string
  location: string
  points: number
  difficulty: "Fácil" | "Médio" | "Difícil"
  description: string
  createdAt: Date
  active: boolean
}

const mockQRCodes: QRCodeData[] = [
  {
    id: "qr-001",
    name: "Praça Central",
    location: "Praça Dom Pedro II, Centro",
    points: 50,
    difficulty: "Fácil",
    description: "QR Code localizado próximo ao chafariz",
    createdAt: new Date("2024-01-15"),
    active: true
  },
  {
    id: "qr-002",
    name: "Biblioteca Municipal",
    location: "Av. Principal, 123",
    points: 75,
    difficulty: "Médio",
    description: "Entrada principal da biblioteca",
    createdAt: new Date("2024-01-20"),
    active: true
  },
  {
    id: "qr-003",
    name: "Parque das Árvores",
    location: "Rua das Flores, s/n",
    points: 100,
    difficulty: "Difícil",
    description: "Trilha escondida no parque",
    createdAt: new Date("2024-01-25"),
    active: false
  }
]

export function AdminQRCreator() {
  const [qrCodes, setQRCodes] = useState<QRCodeData[]>(mockQRCodes)
  const [isCreating, setIsCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    points: 50,
    difficulty: "Fácil" as "Fácil" | "Médio" | "Difícil",
    description: ""
  })

  const handleCreate = () => {
    const newQR: QRCodeData = {
      id: `qr-${Date.now()}`,
      ...formData,
      createdAt: new Date(),
      active: true
    }
    setQRCodes([newQR, ...qrCodes])
    setFormData({
      name: "",
      location: "",
      points: 50,
      difficulty: "Fácil",
      description: ""
    })
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    setQRCodes(qrCodes.filter(qr => qr.id !== id))
  }

  const handleToggleActive = (id: string) => {
    setQRCodes(qrCodes.map(qr => 
      qr.id === id ? { ...qr, active: !qr.active } : qr
    ))
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const difficultyColors = {
    "Fácil": "bg-green-500/20 text-green-400 border-green-500/30",
    "Médio": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Difícil": "bg-red-500/20 text-red-400 border-red-500/30"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HexagonLogo size="sm" />
            <div>
              <h1 className="font-bold text-lg">
                <span className="text-primary">QR</span>
                <span className="text-secondary"> Hunt</span>
                <span className="text-muted-foreground ml-2 text-sm font-normal">Admin</span>
              </h1>
            </div>
          </div>
          
          <Button
            onClick={() => setIsCreating(true)}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo QR Code
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{qrCodes.length}</p>
            <p className="text-sm text-muted-foreground">Total de QR Codes</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-foreground">{qrCodes.filter(qr => qr.active).length}</p>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {qrCodes.reduce((acc, qr) => acc + qr.points, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Pontos Totais</p>
          </div>
        </div>

        {/* Modal de Criação */}
        {isCreating && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Criar QR Code</h2>
                  <p className="text-sm text-muted-foreground">Preencha os dados do novo QR Code</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Nome do Local</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Praça Central"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Endereço
                  </Label>
                  <Input
                    id="location"
                    placeholder="Ex: Rua das Flores, 123"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-input border-border text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-foreground flex items-center gap-2">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      Pontos
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      min={10}
                      max={500}
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                      className="bg-input border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Dificuldade</Label>
                    <div className="flex gap-2">
                      {(["Fácil", "Médio", "Difícil"] as const).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setFormData({ ...formData, difficulty: diff })}
                          className={cn(
                            "flex-1 py-2 px-2 text-xs rounded-lg border transition-all",
                            formData.difficulty === diff
                              ? difficultyColors[diff]
                              : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Dica de localização ou descrição do local..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-input border-border text-foreground resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90"
                    onClick={handleCreate}
                    disabled={!formData.name || !formData.location}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar QR Code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de QR Codes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">QR Codes Cadastrados</h2>
          
          {qrCodes.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <QrCode className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nenhum QR Code cadastrado ainda</p>
              <Button
                onClick={() => setIsCreating(true)}
                className="mt-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro QR Code
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {qrCodes.map((qr) => (
                <div
                  key={qr.id}
                  className={cn(
                    "bg-card border rounded-xl p-4 transition-all",
                    qr.active ? "border-border" : "border-border/50 opacity-60"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* QR Code Preview */}
                    <div className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0",
                      qr.active 
                        ? "bg-gradient-to-br from-primary/20 to-secondary/20" 
                        : "bg-muted/30"
                    )}>
                      <QrCode className={cn(
                        "w-8 h-8",
                        qr.active ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{qr.name}</h3>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          difficultyColors[qr.difficulty]
                        )}>
                          {qr.difficulty}
                        </span>
                        {!qr.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Inativo
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" />
                        {qr.location}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-primary font-medium">+{qr.points} pts</span>
                        <button
                          onClick={() => handleCopyId(qr.id)}
                          className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          {copiedId === qr.id ? (
                            <>
                              <Check className="w-3 h-3 text-green-400" />
                              <span className="text-green-400">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="font-mono text-xs">{qr.id}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(qr.id)}
                        className={cn(
                          "transition-colors",
                          qr.active 
                            ? "text-green-400 hover:text-green-300 hover:bg-green-500/10" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(qr.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {qr.description && (
                    <p className="mt-3 text-sm text-muted-foreground pl-20">
                      {qr.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
