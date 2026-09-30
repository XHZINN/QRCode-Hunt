"use client"

import { useState, useEffect, useRef } from "react"
import { AuthForm } from "@/components/auth-form"
import { HomeScreen } from "@/components/home-screen"
import { RankingScreen } from "@/components/ranking-list"
import { UserProfile } from "@/components/user-profile"
import { QRScanner } from "@/components/qr-scanner"
import { BottomNav } from "@/components/bottom-nav"
import { WordmarkInline } from "@/components/itw/brand"
import { PixelStars } from "@/components/itw/decor"
import { ArrowLeft } from "lucide-react"
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap"

const TAB_LABEL: Record<string, string> = {
  home: "início",
  scan: "scanner",
  ranking: "ranking",
  profile: "perfil",
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [isLoading, setIsLoading] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)

  // Verifica se o usuário já está logado ao carregar a página
  useEffect(() => {
    const savedUser = localStorage.getItem("user_nexp")
    if (savedUser) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  // Transição entre abas
  useGSAP(
    () => {
      if (!contentRef.current) return
      window.scrollTo({ top: 0 })
      if (prefersReducedMotion()) return
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: "expo.out", clearProps: "transform" },
      )
    },
    { dependencies: [activeTab, isAuthenticated] },
  )

  // 1. Enquanto checa o localStorage, não renderiza nada para evitar "pulo" de tela
  if (isLoading) return <div className="min-h-dvh bg-ink" />

  // 2. Se não estiver autenticado, mostra APENAS o formulário de login
  if (!isAuthenticated) {
    return (
      <main>
        <AuthForm onSuccess={() => setIsAuthenticated(true)} />
      </main>
    )
  }

  // 3. Se estiver autenticado, mostra o App principal
  return (
    <main className="relative min-h-dvh bg-ink pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+28px)]">
      <PixelStars count={22} seed={11} className="fixed opacity-60" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 pt-safe backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {activeTab !== "home" && (
              <button
                onClick={() => setActiveTab("home")}
                aria-label="Voltar ao início"
                className="-ml-1 flex h-9 w-9 items-center justify-center border border-line-strong text-muted-foreground transition-transform active:scale-90"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <WordmarkInline className="text-[17px]" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <span className="text-crimson">//</span> {TAB_LABEL[activeTab]}
          </span>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div ref={contentRef} key={activeTab} className="relative mx-auto max-w-md px-4 pt-6">
        {activeTab === "home" && <HomeScreen onNavigate={setActiveTab} />}

        {activeTab === "scan" && <QRScanner />}

        {activeTab === "ranking" && <RankingScreen />}

        {activeTab === "profile" && <UserProfile />}
      </div>

      {/* Navegação inferior */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  )
}
