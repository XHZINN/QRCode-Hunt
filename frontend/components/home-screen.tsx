"use client"

import { HexagonLogo } from "@/components/hexagon-logo"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { QrCode, Trophy, MapPin, ChevronRight } from "lucide-react"

interface HomeScreenProps {
  onNavigate: (tab: string) => void
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="space-y-6">
      {/* Header com boas-vindas */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">Olá,</p>
          <h1 className="text-2xl font-bold text-foreground">João Silva</h1>
        </div>
        <Avatar className="w-12 h-12 border-2 border-primary">
          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
            JS
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Card de estatísticas rápidas */}
      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <HexagonLogo size="md" />
          <div>
            <p className="text-sm text-muted-foreground">Sua pontuação</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              2.180
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <QuickStat icon={<QrCode className="w-4 h-4" />} value="28" label="QR Codes" />
          <QuickStat icon={<Trophy className="w-4 h-4" />} value="#5" label="Ranking" />
          <QuickStat icon={<MapPin className="w-4 h-4" />} value="12" label="Locais" />
        </div>
      </div>

      {/* CTA para escanear */}
      <Button
        onClick={() => onNavigate("scan")}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-8 rounded-2xl glow-cyan group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-foreground/20 rounded-xl">
            <QrCode className="w-8 h-8" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold">Escanear QR Code</p>
            <p className="text-sm opacity-80">Encontre códigos e ganhe pontos</p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 ml-auto group-hover:translate-x-1 transition-transform" />
      </Button>

      {/* Top 3 do ranking */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Líderes do Ranking
          </h2>
          <button 
            onClick={() => onNavigate("ranking")}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Ver todos
          </button>
        </div>

        <div className="space-y-2">
          <LeaderCard position={1} name="Ana Silva" points={2850} />
          <LeaderCard position={2} name="Carlos Santos" points={2720} />
          <LeaderCard position={3} name="Maria Oliveira" points={2580} />
        </div>
      </div>
    </div>
  )
}

function QuickStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-primary mb-1">
        {icon}
        <span className="font-bold text-foreground">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}



function LeaderCard({ position, name, points }: { position: number; name: string; points: number }) {
  const positionColors = {
    1: "bg-yellow-500 text-yellow-950",
    2: "bg-gray-400 text-gray-950",
    3: "bg-amber-600 text-amber-950"
  }

  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:border-primary/50 transition-colors">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${positionColors[position as keyof typeof positionColors]}`}>
        {position}
      </div>
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs font-semibold">
          {name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 font-medium text-foreground">{name}</span>
      <span className="font-bold text-secondary">{points.toLocaleString()}</span>
    </div>
  )
}
