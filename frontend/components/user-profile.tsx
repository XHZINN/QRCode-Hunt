"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  QrCode, 
  Trophy, 
  Target, 
  Calendar, 
  MapPin, 
  Edit3, 
  Check, 
  X,
  Star,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UserStats {
  qrCodesFound: number
  totalPoints: number
  ranking: number
  daysActive: number
  badges: Badge[]
}

interface Badge {
  id: string
  name: string
  icon: React.ReactNode
  unlocked: boolean
  description: string
}

const mockUser = {
  name: "João Silva",
  email: "joao@email.com",
  avatar: "",
  location: "São Paulo, SP",
  memberSince: "Janeiro 2024"
}

const mockStats: UserStats = {
  qrCodesFound: 28,
  totalPoints: 2180,
  ranking: 5,
  daysActive: 45,
  badges: [
    { id: "1", name: "Iniciante", icon: <Star className="w-5 h-5" />, unlocked: true, description: "Encontrou seu primeiro QR Code" },
    { id: "2", name: "Caçador", icon: <Target className="w-5 h-5" />, unlocked: true, description: "Encontrou 10 QR Codes" },
    { id: "3", name: "Explorador", icon: <MapPin className="w-5 h-5" />, unlocked: true, description: "Visitou 5 locais diferentes" },
    { id: "4", name: "Mestre", icon: <Trophy className="w-5 h-5" />, unlocked: false, description: "Alcançou o top 3 do ranking" },
    { id: "5", name: "Lendário", icon: <Zap className="w-5 h-5" />, unlocked: false, description: "Encontrou 100 QR Codes" },
  ]
}

const recentActivity = [
  { id: 1, action: "QR Code encontrado", location: "Praça da Sé", points: 50, time: "2 horas atrás" },
  { id: 2, action: "Badge desbloqueado", location: "Em Chamas", points: 100, time: "1 dia atrás" },
  { id: 3, action: "QR Code encontrado", location: "Parque Ibirapuera", points: 75, time: "1 dia atrás" },
  { id: 4, action: "QR Code encontrado", location: "MASP", points: 60, time: "2 dias atrás" },
]

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(mockUser.name)

  const handleSave = () => {
    // Salvar alterações
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      {/* Header do perfil */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary glow-cyan">
              <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-2xl font-bold">
                {mockUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs font-bold">
              #{mockStats.ranking}
            </div>
          </div>

          {/* Informações */}
          <div className="flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="max-w-[200px] bg-input"
                />
                <Button size="icon" variant="ghost" onClick={handleSave} className="text-green-500 hover:text-green-400">
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-400">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <h2 className="text-2xl font-bold text-foreground">{mockUser.name}</h2>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="text-muted-foreground hover:text-primary">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground">{mockUser.email}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 justify-center sm:justify-start">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {mockUser.location}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Membro desde {mockUser.memberSince}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<QrCode className="w-6 h-6" />}
          label="QR Codes"
          value={mockStats.qrCodesFound}
          color="cyan"
        />
        <StatCard
          icon={<Star className="w-6 h-6" />}
          label="Pontos"
          value={mockStats.totalPoints.toLocaleString()}
          color="magenta"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          label="Ranking"
          value={`#${mockStats.ranking}`}
          color="cyan"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Dias Ativos"
          value={mockStats.daysActive}
          color="magenta"
        />
      </div>

      {/* Badges */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Conquistas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {mockStats.badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl border transition-all",
                badge.unlocked
                  ? "bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/50"
                  : "bg-muted/50 border-border opacity-50"
              )}
            >
              <div className={cn(
                "p-3 rounded-full mb-2",
                badge.unlocked
                  ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {badge.icon}
              </div>
              <span className="text-sm font-medium text-foreground text-center">{badge.name}</span>
              <span className="text-xs text-muted-foreground text-center mt-1">{badge.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Atividade recente */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-secondary" />
          Atividade Recente
        </h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.location}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">+{activity.points}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: string | number
  color: "cyan" | "magenta"
}) {
  return (
    <div className={cn(
      "bg-card border rounded-xl p-4 text-center transition-all hover:scale-105",
      color === "cyan" ? "border-primary/30 hover:border-primary" : "border-secondary/30 hover:border-secondary"
    )}>
      <div className={cn(
        "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
        color === "cyan" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
      )}>
        {icon}
      </div>
      <p className={cn(
        "text-2xl font-bold",
        color === "cyan" ? "text-primary" : "text-secondary"
      )}>
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
