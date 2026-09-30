"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  QrCode, Trophy, Target, Edit3, Check, Star, Zap, LogOut, Medal, Pin, X, ScanFace
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiFetch, getStoredUser, salvarSessao, limparSessao } from "@/lib/api"

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
      alert("Erro ao salvar nome. Tente novamente.")
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
      alert("Erro ao carregar seu QR Code. Tente novamente.")
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-500">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary glow-cyan">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl font-bold">
                {user.nome?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs font-black">
              #{stats.ranking}
            </div>
          </div>

          {/* Nome editável */}
          <div className="w-full max-w-xs">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="bg-muted border-primary/50 text-center" />
                <Button size="icon" variant="ghost" onClick={handleSalvarNome} className="text-green-500">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-foreground truncate">{user.nome}</h2>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="text-muted-foreground"><Edit3 className="w-4 h-4" /></Button>
              </div>
            )}
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>

          <Button onClick={handleAbrirMeuQrCode} variant="outline" size="sm" className="gap-2 border-secondary/40 text-secondary hover:bg-secondary/10">
            <ScanFace className="w-4 h-4" /> Meu QR Code
          </Button>

          {/* Medalhas favoritas (exibidas no perfil/ranking) */}
          {favMedalhaObjs.length > 0 && (
            <div className="flex items-center gap-2">
              {favMedalhaObjs.map(m => (
                <div key={m.id_medalha} title={m.nome}
                  className="w-10 h-10 rounded-full border-2 border-yellow-500/50 overflow-hidden bg-muted shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                  {m.imagem_base64
                    ? <img src={m.imagem_base64} alt={m.nome} className="w-full h-full object-cover" />
                    : <Medal className="w-5 h-5 m-auto mt-2 text-yellow-500" />}
                </div>
              ))}
              <button onClick={() => setIsSelectorOpen(true)} className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 transition-all">
                <Pin className="w-4 h-4" />
              </button>
            </div>
          )}
          {favMedalhaObjs.length === 0 && medalhas.length > 0 && (
            <button onClick={() => setIsSelectorOpen(true)}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <Pin className="w-3 h-3" /> Escolher medalhas favoritas
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={<QrCode className="w-5 h-5" />} label="QRs" value={stats.qrCodesFound} color="cyan" />
        <StatCard icon={<Star className="w-5 h-5" />} label="Pontos" value={stats.totalPoints.toLocaleString()} color="magenta" />
        <StatCard icon={<Zap className="w-5 h-5" />} label="Nível" value={stats.nivel} color="green" />
        <StatCard icon={<Medal className="w-5 h-5" />} label="Medalhas" value={medalhas.length} color="yellow" />
      </div>

      {/* Mural de Medalhas */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Medal className="w-4 h-4 text-yellow-500" /> Mural de Medalhas
          </h3>
          {medalhas.length > 0 && (
            <button onClick={() => setIsSelectorOpen(true)}
              className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
              <Pin className="w-3 h-3" /> Escolher favoritas
            </button>
          )}
        </div>

        {medalhas.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Medal className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Nenhuma medalha conquistada ainda.<br />Escaneie QR Codes para ganhar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {medalhas.map(m => {
              const isFav = favMedalhas.includes(m.id_medalha)
              return (
                <div key={m.id_medalha}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer",
                    isFav ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_10px_rgba(234,179,8,0.1)]" : "border-border hover:border-primary/40"
                  )}
                  onClick={() => toggleFavMedalha(m.id_medalha)}
                  title={isFav ? "Remover dos favoritos" : favMedalhas.length < 3 ? "Adicionar aos favoritos" : "Já tem 3 favoritas"}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full overflow-hidden border-2 flex items-center justify-center bg-muted",
                    isFav ? "border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.3)]" : "border-border"
                  )}>
                    {m.imagem_base64
                      ? <img src={m.imagem_base64} alt={m.nome} className="w-full h-full object-cover" />
                      : <Medal className="w-7 h-7 text-yellow-500" />}
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight line-clamp-2">{m.nome}</span>
                  {isFav && (
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      <Pin className="w-2.5 h-2.5" />
                      <span className="text-[9px] font-black">FAVORITA</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Seletor de Favoritas */}
      {isSelectorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Medalhas Favoritas</h3>
                <p className="text-xs text-muted-foreground">Escolha até 3 para exibir no perfil</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setIsSelectorOpen(false)}><X className="w-4 h-4" /></Button>
            </div>

            {/* Slots visuais */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2].map(i => {
                const m = favMedalhaObjs[i]
                return (
                  <div key={i} className={cn(
                    "w-16 h-16 rounded-full border-2 flex items-center justify-center",
                    m ? "border-yellow-500 overflow-hidden" : "border-dashed border-border"
                  )}>
                    {m
                      ? (m.imagem_base64 ? <img src={m.imagem_base64} alt={m.nome} className="w-full h-full object-cover" /> : <Medal className="w-7 h-7 text-yellow-500" />)
                      : <span className="text-muted-foreground text-xl">+</span>}
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {medalhas.map(m => {
                const isFav = favMedalhas.includes(m.id_medalha)
                const disabled = !isFav && favMedalhas.length >= 3
                return (
                  <button
                    key={m.id_medalha}
                    onClick={() => !disabled && toggleFavMedalha(m.id_medalha)}
                    disabled={disabled}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all",
                      isFav ? "border-yellow-500 bg-yellow-500/10" : "border-border",
                      disabled ? "opacity-30 cursor-not-allowed" : "hover:border-primary/50 cursor-pointer"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                      {m.imagem_base64 ? <img src={m.imagem_base64} alt={m.nome} className="w-full h-full object-cover" /> : <Medal className="w-5 h-5 text-yellow-500" />}
                    </div>
                    <span className="text-[9px] font-bold text-center line-clamp-2 leading-tight">{m.nome}</span>
                    {isFav && <Check className="w-3 h-3 text-yellow-500" />}
                  </button>
                )
              })}
            </div>

            <Button className="w-full bg-primary text-black font-bold" onClick={() => setIsSelectorOpen(false)}>
              Confirmar ({favMedalhas.length}/3)
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Meu QR Code pessoal */}
      {isQrOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-secondary/40 rounded-3xl w-full max-w-sm p-6 space-y-4 text-center animate-in zoom-in duration-300">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base">Meu QR Code</h3>
              <Button size="icon" variant="ghost" onClick={() => setIsQrOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
            <p className="text-xs text-muted-foreground">Mostre para um amigo escanear e ganhe XP quando ele te capturar.</p>
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center min-h-[220px]">
              {isLoadingQr && <p className="text-muted-foreground text-sm">Gerando...</p>}
              {!isLoadingQr && meuQrUrl && <img src={meuQrUrl} alt="Meu QR Code pessoal" className="w-full max-w-[220px]" />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    cyan: "border-primary/20 bg-primary/5 text-primary",
    magenta: "border-secondary/20 bg-secondary/5 text-secondary",
    yellow: "border-yellow-500/20 bg-yellow-500/5 text-yellow-500",
    green: "border-green-500/20 bg-green-500/5 text-green-500",
  }
  return (
    <div className={cn("bg-card border rounded-2xl p-4 flex flex-col items-center justify-center transition-all", colors[color].split(" ").slice(0, 2).join(" "))}>
      <div className={cn("mb-1", colors[color].split(" ").slice(2).join(" "))}>{icon}</div>
      <span className="text-lg font-black text-foreground">{value}</span>
      <span className="text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
    </div>
  )
}
