"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HexagonLogo } from "@/components/hexagon-logo"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react"

interface AuthFormProps {
  onSuccess?: () => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simular autenticação
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    onSuccess?.()
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo e título */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <HexagonLogo size="lg" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="text-primary text-glow-cyan">QR</span>
          <span className="text-secondary text-glow-magenta"> Hunt</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLogin ? "Entre para continuar sua aventura" : "Crie sua conta e comece a caçar"}
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-card border border-border rounded-xl p-6 glow-cyan/30">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 bg-input border-border focus:border-primary focus:ring-primary"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10 bg-input border-border focus:border-primary focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10 bg-input border-border focus:border-primary focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 bg-input border-border focus:border-primary focus:ring-primary"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {isLogin && (
            <div className="flex justify-end">
              <button type="button" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Esqueceu a senha?
              </button>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-6 glow-cyan"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Carregando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isLogin ? "Entrar" : "Criar Conta"}
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </form>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-4 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Alternar entre login e cadastro */}
        <p className="text-center text-muted-foreground">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {isLogin ? "Cadastre-se" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  )
}
