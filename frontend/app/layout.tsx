import type { Metadata, Viewport } from 'next'
import { Geist, JetBrains_Mono, Orbitron } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geist = Geist({
  subsets: ["latin"],
  variable: '--font-geist',
})
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains',
})
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: '--font-orbitron',
})

export const metadata: Metadata = {
  title: 'IT-WORKS · Caça ao QR',
  description: 'Escaneie, responda e suba no ranking do IT-WORKS — Escola de Tecnologia UNDB.',
  applicationName: 'IT-WORKS',
  appleWebApp: {
    capable: true,
    title: 'IT-WORKS',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#030304',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geist.variable} ${jetbrains.variable} ${orbitron.variable} dark bg-background`}
    >
      <body className="font-sans antialiased min-h-dvh">
        {children}
        <Toaster theme="dark" position="top-center" offset={16} />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
