"use client"

import { useEffect, useState } from "react"
import { HexagonLogo } from "@/components/hexagon-logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QrCode, Trophy, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiFetch, getStoredUser } from "@/lib/api"

interface HomeScreenProps {
  onNavigate: (tab: string) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [userData, setUserData] = useState<any>(null)
  const [topPlayers, setTopPlayers] = useState<any[]>([])
  const [stats, setStats] = useState({
    qrCodes: "--",
    ranking: "--"
  })

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
          setTopPlayers(rankingData)

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
        }
      }
      loadData()
    }
  }, [])

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "??"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Olá,</p>
          <h1 className="text-2xl font-bold text-foreground truncate max-w-[200px]">
            {userData?.nome || "Explorador"}
          </h1>
        </div>
        <Avatar className="w-12 h-12 border-2 border-primary">
          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
            {getInitials(userData?.nome)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Card de Pontuação - Grid de 2 colunas agora */}
      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
        <div className="flex items-center gap-3 mb-6">
          <HexagonLogo size="md" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Total de Pontos</p>
            <p className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {userData?.pontos?.toLocaleString() || "0"}
            </p>
          </div>
          {userData?.nivel && (
            <div className="bg-background/40 border border-primary/20 rounded-xl px-3 py-2 text-center shrink-0">
              <p className="text-[9px] uppercase font-bold text-muted-foreground">Nível</p>
              <p className="text-lg font-black text-primary">{userData.nivel}</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-primary/10 pt-4">
          <QuickStat icon={<QrCode className="w-4 h-4" />} value={stats.qrCodes} label="Lidos" />
          <QuickStat icon={<Trophy className="w-4 h-4" />} value={stats.ranking} label="Posição" />
        </div>
      </div>

      {/* Botão de Scan */}
      <Button
        onClick={() => onNavigate("scan")}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-bold py-8 rounded-2xl glow-cyan group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-foreground/20 rounded-xl">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-lg">ESCANEAR AGORA</p>
            <p className="text-xs opacity-70 uppercase tracking-tighter">Clique para abrir a câmera</p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 ml-auto group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Ranking */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Top Jogadores
          </h2>
          <button 
            onClick={() => onNavigate("ranking")}
            className="text-xs font-bold text-primary hover:underline"
          >
            VISUALIZAR
          </button>
        </div>

        <div className="space-y-2">
          {topPlayers.map((player, index) => (
            <LeaderCard 
              key={index} 
              position={index + 1} 
              name={player.nome} 
              points={player.pontos} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-background/40">
      <div className="flex items-center gap-1 text-primary mb-0.5">
        {icon}
        <span className="font-black text-foreground text-lg">{value}</span>
      </div>
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
    </div>
  )
}

function LeaderCard({ position, name, points }: { position: number; name: string; points: number }) {
  const colors = ["bg-yellow-500", "bg-gray-400", "bg-amber-600", "text-white"]
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
      <div className={cn(
        "w-6 h-6 rounded-md flex items-center justify-center font-black text-[10px]",
        colors[position-1] || "bg-muted text-muted-foreground"
      )}>
        {position}
      </div>
      <span className="flex-1 font-bold text-sm text-foreground truncate">{name}</span>
      <span className="font-black text-xs text-primary">{points.toLocaleString()}</span>
    </div>
  )
}
