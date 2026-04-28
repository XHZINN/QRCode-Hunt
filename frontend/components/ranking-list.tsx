"use client"

import { Trophy, Medal, Crown, QrCode, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Player {
  id: number
  name: string
  avatar?: string
  score: number
  qrCodesFound: number
  trend: "up" | "down" | "same"
  position: number
}

const mockPlayers: Player[] = [
  { id: 1, name: "Ana Silva", score: 2850, qrCodesFound: 42, trend: "up", position: 1 },
  { id: 2, name: "Carlos Santos", score: 2720, qrCodesFound: 38, trend: "same", position: 2 },
  { id: 3, name: "Maria Oliveira", score: 2580, qrCodesFound: 35, trend: "up", position: 3 },
  { id: 4, name: "João Pedro", score: 2340, qrCodesFound: 31, trend: "down", position: 4 },
  { id: 5, name: "Beatriz Costa", score: 2180, qrCodesFound: 28, trend: "up", position: 5 },
  { id: 6, name: "Lucas Ferreira", score: 1950, qrCodesFound: 25, trend: "same", position: 6 },
  { id: 7, name: "Fernanda Lima", score: 1820, qrCodesFound: 23, trend: "down", position: 7 },
  { id: 8, name: "Rafael Souza", score: 1680, qrCodesFound: 21, trend: "up", position: 8 },
  { id: 9, name: "Juliana Alves", score: 1520, qrCodesFound: 19, trend: "same", position: 9 },
  { id: 10, name: "Thiago Martins", score: 1380, qrCodesFound: 17, trend: "down", position: 10 },
]

function getTrendIcon(trend: "up" | "down" | "same") {
  switch (trend) {
    case "up":
      return <TrendingUp className="w-4 h-4 text-green-500" />
    case "down":
      return <TrendingDown className="w-4 h-4 text-red-500" />
    default:
      return <Minus className="w-4 h-4 text-muted-foreground" />
  }
}

function getPositionIcon(position: number) {
  switch (position) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-500" />
    case 2:
      return <Medal className="w-6 h-6 text-gray-400" />
    case 3:
      return <Medal className="w-6 h-6 text-amber-600" />
    default:
      return null
  }
}

function getPositionStyle(position: number) {
  switch (position) {
    case 1:
      return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50"
    case 2:
      return "bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/50"
    case 3:
      return "bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/50"
    default:
      return "bg-card border-border hover:border-primary/50"
  }
}

export function RankingList() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
        <span className="w-12">#</span>
        <span className="flex-1">Jogador</span>
        <span className="w-24 text-center">QR Codes</span>
        <span className="w-24 text-right">Pontos</span>
        <span className="w-12 text-center">Trend</span>
      </div>

      {/* Lista de jogadores */}
      {mockPlayers.map((player) => (
        <div
          key={player.id}
          className={cn(
            "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200",
            getPositionStyle(player.position)
          )}
        >
          {/* Posição */}
          <div className="w-12 flex items-center justify-center">
            {getPositionIcon(player.position) || (
              <span className="text-lg font-bold text-muted-foreground">{player.position}</span>
            )}
          </div>

          {/* Avatar e nome */}
          <div className="flex-1 flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary/30">
              <AvatarImage src={player.avatar} alt={player.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                {player.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{player.name}</span>
          </div>

          {/* QR Codes encontrados */}
          <div className="w-24 flex items-center justify-center gap-1">
            <QrCode className="w-4 h-4 text-primary" />
            <span className="text-foreground font-medium">{player.qrCodesFound}</span>
          </div>

          {/* Pontuação */}
          <div className="w-24 text-right">
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {player.score.toLocaleString()}
            </span>
          </div>

          {/* Tendência */}
          <div className="w-12 flex justify-center">
            {getTrendIcon(player.trend)}
          </div>
        </div>
      ))}
    </div>
  )
}

export function TopThreePodium() {
  const topThree = mockPlayers.slice(0, 3)
  
  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {/* 2º lugar */}
      <div className="flex flex-col items-center">
        <Avatar className="w-16 h-16 border-4 border-gray-400 mb-2">
          <AvatarFallback className="bg-gradient-to-br from-gray-300 to-gray-500 text-primary-foreground text-lg font-bold">
            {topThree[1].name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm text-foreground">{topThree[1].name}</span>
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
            {topThree[0].name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground">{topThree[0].name}</span>
        <span className="text-sm text-muted-foreground">{topThree[0].score.toLocaleString()} pts</span>
        <div className="mt-2 w-24 h-32 bg-gradient-to-t from-yellow-500/30 to-yellow-500/10 rounded-t-lg flex items-center justify-center">
          <span className="text-4xl font-bold text-yellow-500">1</span>
        </div>
      </div>

      {/* 3º lugar */}
      <div className="flex flex-col items-center">
        <Avatar className="w-16 h-16 border-4 border-amber-600 mb-2">
          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-700 text-primary-foreground text-lg font-bold">
            {topThree[2].name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm text-foreground">{topThree[2].name}</span>
        <span className="text-xs text-muted-foreground">{topThree[2].score.toLocaleString()} pts</span>
        <div className="mt-2 w-20 h-16 bg-gradient-to-t from-amber-600/30 to-amber-600/10 rounded-t-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-amber-600">3</span>
        </div>
      </div>
    </div>
  )
}
