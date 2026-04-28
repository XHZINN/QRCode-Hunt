"use client"

import { cn } from "@/lib/utils"

interface HexagonLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function HexagonLogo({ className, size = "md" }: HexagonLogoProps) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20"
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(sizes[size], className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.80 0.18 195)" />
          <stop offset="100%" stopColor="oklch(0.65 0.28 320)" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer hexagon */}
      <path
        d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
        stroke="url(#hexGradient)"
        strokeWidth="3"
        fill="none"
        filter="url(#glow)"
      />
      {/* Inner hexagon */}
      <path
        d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z"
        stroke="url(#hexGradient)"
        strokeWidth="2"
        fill="none"
        filter="url(#glow)"
      />
      {/* QR icon in center */}
      <rect x="38" y="38" width="8" height="8" fill="url(#hexGradient)" />
      <rect x="54" y="38" width="8" height="8" fill="url(#hexGradient)" />
      <rect x="38" y="54" width="8" height="8" fill="url(#hexGradient)" />
      <rect x="50" y="50" width="4" height="4" fill="url(#hexGradient)" />
      <rect x="58" y="54" width="4" height="4" fill="url(#hexGradient)" />
      <rect x="54" y="58" width="4" height="4" fill="url(#hexGradient)" />
    </svg>
  )
}
