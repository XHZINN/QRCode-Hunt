"use client"

import { useEffect, useState } from "react"
import { HexagonLogo } from "@/components/hexagon-logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QrCode, Trophy, ChevronRight } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL
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
    const savedUser = localStorage.getItem("user_nexp")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUserData(parsedUser)

      async function loadData() {
        try {
          const response = await fetch(`${API_URL}/ranking`)
          const data = await response.json()
          
          setTopPlayers(data.slice(0, 3))

          // Encontra o usuário logado no ranking para pegar posição e QRs
          const myIndex = data.findIndex((u: any) => 
            u.id === parsedUser.id_user || u.nome === parsedUser.nome
          )

          if (myIndex !== -1) {
            setStats({
              qrCodes: data[myIndex].qrs_capturados || "0",
              ranking: `#${myIndex + 1}`
            })
            
            // Atualiza os pontos no cabeçalho se o banco tiver algo mais recente
            setUserData((prev: any) => ({...prev, pontos: data[myIndex].pontos}))
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
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Total de Pontos</p>
            <p className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {userData?.pontos?.toLocaleString() || "0"}
            </p>
          </div>
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
            VER FULL
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
  const colors = ["bg-yellow-500", "bg-gray-400", "bg-amber-600"]
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

// Utilitário simples para cores caso não tenha o cn instalado
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}