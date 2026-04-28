"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Zap,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export function UserProfile() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    qrCodesFound: 0,
    totalPoints: 0,
    ranking: "-",
    daysActive: 0
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState("")

  useEffect(() => {
    const savedUser = localStorage.getItem("user_nexp")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      setEditedName(parsedUser.nome)
      
      // Busca o ranking para extrair os dados específicos deste usuário
      async function fetchUserStats() {
        try {
          const response = await fetch(`${API_URL}/ranking`)
          const data = await response.json()
          
          // Tenta encontrar o usuário pelo ID ou pelo Nome (garantia dupla)
          const userData = data.find((u: any) => 
            u.id === parsedUser.id_user || 
            u.nome === parsedUser.nome
          )
          
          if (userData) {
            // Se achou no ranking, atualiza o estado com dados reais
            const position = data.findIndex((u: any) => u.nome === userData.nome) + 1
            
            setStats({
              qrCodesFound: userData.qrs_capturados || 0,
              totalPoints: userData.pontos || 0,
              ranking: position.toString(),
              daysActive: 1 // Pode ser calculado depois
            })
          }
        } catch (error) {
          console.error("Erro ao sincronizar perfil:", error)
        }
      }

      fetchUserStats()
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user_nexp")
    window.location.reload()
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header do perfil */}
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

          <div className="w-full max-w-xs">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-muted border-primary/50 text-center"
                />
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="text-green-500">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-foreground truncate">{user.nome}</h2>
                <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)} className="text-muted-foreground">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Agora com dados reais do ranking */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={<QrCode className="w-5 h-5" />}
          label="QRs Encontrados"
          value={stats.qrCodesFound}
          color="cyan"
        />
        <StatCard
          icon={<Star className="w-5 h-5" />}
          label="Total de Pontos"
          value={stats.totalPoints.toLocaleString()}
          color="magenta"
        />
      </div>

      {/* Badges - Design Cyberpunk */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Conquistas
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <BadgeItem unlocked name="Iniciante" icon={<Star />} />
          <BadgeItem unlocked={stats.qrCodesFound >= 10} name="Caçador" icon={<Target />} />
          <BadgeItem unlocked={stats.qrCodesFound >= 50} name="Mestre" icon={<Zap />} />
          <BadgeItem unlocked={false} name="Lendário" icon={<Trophy />} />
        </div>
      </div>

      {/* Atividade Recente - Mockado por enquanto */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-secondary" />
          Logs de Sistema
        </h3>
        <div className="space-y-2">
          <div className="text-xs p-3 rounded-lg bg-muted/30 border border-border flex justify-between items-center">
            <span className="text-foreground font-medium">Sincronização de conta</span>
            <span className="text-green-500 font-bold">SUCCESS</span>
          </div>
          <div className="text-xs p-3 rounded-lg bg-muted/30 border border-border flex justify-between items-center">
            <span className="text-foreground font-medium">Participação no evento ativa</span>
            <span className="text-primary font-bold">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className={cn(
      "bg-card border rounded-2xl p-4 flex flex-col items-center justify-center transition-all",
      color === "cyan" ? "border-primary/20 bg-primary/5" : "border-secondary/20 bg-secondary/5"
    )}>
      <div className={cn("mb-2", color === "cyan" ? "text-primary" : "text-secondary")}>
        {icon}
      </div>
      <span className="text-xl font-black text-foreground">{value}</span>
      <span className="text-[10px] uppercase font-bold text-muted-foreground">{label}</span>
    </div>
  )
}

function BadgeItem({ unlocked, name, icon }: any) {
  return (
    <div className={cn(
      "shrink-0 w-20 flex flex-col items-center gap-2 p-2 rounded-xl border transition-all",
      unlocked ? "border-primary/40 bg-primary/10" : "border-border bg-muted/20 grayscale opacity-40"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center",
        unlocked ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-muted"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-center leading-tight">{name}</span>
    </div>
  )
}