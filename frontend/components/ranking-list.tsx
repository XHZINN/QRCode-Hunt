"use client"

import { useEffect, useState } from "react"
import { Trophy, Medal, Crown, QrCode, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://nexpgames.onrender.com"

interface Player {
  id: number | string
  name: string
  avatar?: string
  score: number
  qrCodesFound: number
  trend: "up" | "down" | "same"
  position: number
}

// Funções auxiliares mantidas
function getTrendIcon(trend: "up" | "down" | "same") {
  switch (trend) {
    case "up": return <TrendingUp className="w-4 h-4 text-green-500" />
    case "down": return <TrendingDown className="w-4 h-4 text-red-500" />
    default: return <Minus className="w-4 h-4 text-muted-foreground" />
  }
}

function getPositionIcon(position: number) {
  switch (position) {
    case 1: return <Crown className="w-6 h-6 text-yellow-500" />
    case 2: return <Medal className="w-6 h-6 text-gray-400" />
    case 3: return <Medal className="w-6 h-6 text-amber-600" />
    default: return null
  }
}

function getPositionStyle(position: number) {
  switch (position) {
    case 1: return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50"
    case 2: return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/50"
    case 3: return "bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/50"
    default: return "bg-card border-border hover:border-primary/50"
  }
}

export function RankingList() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRanking() {
      try {
        const response = await fetch(`${API_URL}/ranking`)
        const data = await response.json()
        
        const formattedPlayers = data.map((user: any, index: number) => ({
          id: user.id || index,
          name: user.nome || "Anônimo",
          score: user.pontos || 0,
          // Agora mapeia corretamente o campo que enviamos do Python
          qrCodesFound: user.qrs_capturados || 0, 
          trend: "same",
          position: index + 1
        }))
        
        setPlayers(formattedPlayers)
      } catch (error) {
        console.error("Erro ao carregar ranking:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadRanking()
  }, [])

  if (isLoading) return <div className="text-center py-10 text-muted-foreground animate-pulse">Sincronizando placar...</div>

  return (
    <div className="space-y-2">
      {/* Cabeçalho Ajustado */}
      <div className="flex items-center gap-4 px-4 py-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        <span className="w-6 text-center">#</span>
        <span className="flex-1">Jogador</span>
        <span className="w-12 text-center">QRs</span>
        <span className="w-16 text-right">Pts</span>
      </div>

      {players.map((player) => (
        <div
          key={player.id}
          className={cn(
            "flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200",
            getPositionStyle(player.position)
          )}
        >
          {/* Posição */}
          <div className="w-6 shrink-0 flex items-center justify-center">
            {getPositionIcon(player.position) || (
              <span className="text-xs font-bold text-muted-foreground">{player.position}</span>
            )}
          </div>

          {/* Jogador - O container flex-1 com min-w-0 permite que o nome use o espaço que sobrar */}
          <div className="flex-1 flex items-center gap-2 min-w-0"> 
            <Avatar className="w-8 h-8 shrink-0 border border-primary/20">
              <AvatarFallback className="bg-muted text-[10px] font-bold">
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm text-foreground truncate">
              {player.name}
            </span>
          </div>

          {/* QR Codes - Compacto */}
          <div className="w-12 shrink-0 flex flex-col items-center justify-center bg-primary/5 rounded-lg py-1">
            <span className="text-xs font-bold text-primary">{player.qrCodesFound}</span>
          </div>

          {/* Pontos - Alinhado à direita */}
          <div className="w-16 shrink-0 text-right">
            <span className="text-xs font-black text-foreground">
              {player.score.toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
export function TopThreePodium() {
  const [topThree, setTopThree] = useState<Player[]>([])

  useEffect(() => {
    async function loadTopThree() {
      try {
        const response = await fetch(`${API_URL}/ranking`)
        const data = await response.json()
        const formatted = data.slice(0, 3).map((user: any, index: number) => ({
          name: user.nome,
          score: user.pontos,
          position: index + 1
        }))
        setTopThree(formatted)
      } catch (error) {}
    }
    loadTopThree()
  }, [])

  if (topThree.length < 3) return null

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {/* 2º lugar */}
      <div className="flex flex-col items-center">
        <Avatar className="w-16 h-16 border-4 border-gray-400 mb-2">
          <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-500 text-primary-foreground text-lg font-bold">
            {topThree[1].name[0]}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm text-foreground max-w-[80px] truncate text-center">{topThree[1].name}</span>
        <span className="text-xs text-muted-foreground">{topThree[1].score.toLocaleString()} pts</span>
        <div className="mt-2 w-20 h-24 bg-gradient-to-t from-gray-400/30 to-gray-400/10 rounded-t-lg flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-400">2</span>
        </div>
      </div>

      {/* 1º lugar */}
      <div className="flex flex-col items-center -mb-4">
        <Crown className="w-8 h-8 text-yellow-500 mb-1" />
        <Avatar className="w-20 h-20 border-4 border-yellow-500 mb-2 glow-cyan">
          <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-primary-foreground text-xl font-bold">
            {topThree[0].name[0]}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground max-w-[100px] truncate text-center">{topThree[0].name}</span>
        <span className="text-sm text-muted-foreground">{topThree[0].score.toLocaleString()} pts</span>
        <div className="mt-2 w-24 h-32 bg-gradient-to-t from-yellow-500/30 to-yellow-500/10 rounded-t-lg flex items-center justify-center">
          <span className="text-4xl font-bold text-yellow-500">1</span>
        </div>
      </div>

      {/* 3º lugar */}
      <div className="flex flex-col items-center">
        <Avatar className="w-16 h-16 border-4 border-amber-600 mb-2">
          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-primary-foreground text-lg font-bold">
            {topThree[2].name[0]}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm text-foreground max-w-[80px] truncate text-center">{topThree[2].name}</span>
        <span className="text-xs text-muted-foreground">{topThree[2].score.toLocaleString()} pts</span>
        <div className="mt-2 w-20 h-16 bg-gradient-to-t from-amber-600/30 to-amber-600/10 rounded-t-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-amber-600">3</span>
        </div>
      </div>
    </div>
  )
}