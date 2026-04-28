"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { HomeScreen } from "@/components/home-screen"
import { RankingList, TopThreePodium } from "@/components/ranking-list"
import { UserProfile } from "@/components/user-profile"
import { QRScanner } from "@/components/qr-scanner"
import { BottomNav } from "@/components/bottom-nav"
import { HexagonLogo } from "@/components/hexagon-logo"
import { Trophy, ArrowLeft, Settings, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState("home")

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-cyber-gradient circuit-pattern flex items-center justify-center p-4">
        {/* Efeitos de fundo */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 w-full">
          <AuthForm onSuccess={() => setIsAuthenticated(true)} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== "home" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab("home")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <HexagonLogo size="sm" />
            <h1 className="font-bold text-lg">
              <span className="text-primary">QR</span>
              <span className="text-secondary"> Hunt</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {activeTab === "home" && (
          <HomeScreen onNavigate={setActiveTab} />
        )}

        {activeTab === "scan" && (
          <QRScanner />
        )}

        {activeTab === "ranking" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                Ranking Global
              </h2>
              <p className="text-muted-foreground mt-1">Os melhores caçadores de QR Code</p>
            </div>
            
            <TopThreePodium />
            
            <div className="bg-card border border-border rounded-2xl p-4">
              <RankingList />
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <UserProfile />
        )}
      </div>

      {/* Navegação inferior */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  )
}
