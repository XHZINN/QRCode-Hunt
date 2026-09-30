"use client"

import { Home, Trophy, QrCode, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptic } from "@/lib/gsap"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const leftItems = [
  { id: "home", label: "Início", icon: Home },
  { id: "ranking", label: "Ranking", icon: Trophy },
]
const rightItems = [{ id: "profile", label: "Perfil", icon: User }]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const go = (id: string) => {
    if (id !== activeTab) haptic(8)
    onTabChange(id)
  }
  const scanActive = activeTab === "scan"

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink/90 pb-safe backdrop-blur-md" aria-label="Navegação principal">
      <div className="mx-auto grid h-[var(--nav-h)] max-w-md grid-cols-4 items-stretch px-2">
        {leftItems.map((item) => (
          <NavItem key={item.id} {...item} active={activeTab === item.id} onClick={() => go(item.id)} />
        ))}

        {/* Botão central de scan */}
        <div className="relative flex items-start justify-center">
          <button
            onClick={() => go("scan")}
            aria-label="Escanear QR Code"
            aria-current={scanActive ? "page" : undefined}
            className="relative -mt-5 flex flex-col items-center gap-1.5"
          >
            <span className="relative flex h-[62px] w-[62px] items-center justify-center">
              {!scanActive && <span aria-hidden className="animate-pulse-ring absolute inset-0 border-2 border-cyan" />}
              <span
                className={cn(
                  "notch relative flex h-full w-full items-center justify-center transition-[transform,background-color] duration-200 active:scale-90",
                  scanActive ? "bg-white" : "bg-cyan",
                )}
              >
                <QrCode className="h-7 w-7 text-ink" strokeWidth={2.2} />
              </span>
            </span>
            <span className={cn("font-mono text-[9px] uppercase tracking-[0.2em]", scanActive ? "text-white" : "text-cyan")}>Scan</span>
          </button>
        </div>

        {rightItems.map((item) => (
          <NavItem key={item.id} {...item} active={activeTab === item.id} onClick={() => go(item.id)} />
        ))}
      </div>
    </nav>
  )
}

function NavItem({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: typeof Home
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="relative flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-90"
    >
      <span
        aria-hidden
        className={cn(
          "absolute top-0 h-[2px] w-7 bg-cyan transition-transform duration-300 ease-out",
          active ? "scale-x-100" : "scale-x-0",
        )}
      />
      <Icon className={cn("h-[22px] w-[22px] transition-colors", active ? "text-white" : "text-muted-foreground")} strokeWidth={active ? 2.2 : 1.8} />
      <span
        className={cn(
          "font-mono text-[9px] uppercase tracking-[0.2em] transition-colors",
          active ? "text-white" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  )
}
