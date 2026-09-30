"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HexagonLogo } from "@/components/hexagon-logo"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Phone, Calendar} from "lucide-react"
import { apiFetch, salvarSessao } from "@/lib/api"

interface AuthFormProps {
  onSuccess?: (userData: any) => void
}

type Modo = "login" | "cadastro" | "definir-senha"

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [modo, setModo] = useState<Modo>("login")
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    senha: "",
    data_nasc: "",
    escola: "",
    telefone: "",
  })

  const [opcoes, setOpcoes] = useState({
    escola: [] as string[],
  })

  useEffect(() => {
    async function fetchOpcoes() {
      const escola = await apiFetch(`/opcoes/escola`)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])

      setOpcoes({ escola: Array.isArray(escola) ? escola : [] })
    }
    fetchOpcoes()
  }, [])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length <= 11) {
      value = value.replace(/^(\d{2})(\d)/g, "($1) $2")
      value = value.replace(/(\d{5})(\d)/, "$1-$2")
      setFormData({ ...formData, telefone: value })
    }
  }

  const entrarComSessao = (data: { user: any; token: string }) => {
    salvarSessao(data.user, data.token)
    if (data.user.is_admin) {
      router.push("/admin")
    } else {
      onSuccess?.(data.user)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (modo === "login") {
        const response = await apiFetch(`/login`, {
          method: "POST",
          body: new URLSearchParams({ email: formData.email.toLowerCase(), senha: formData.senha }),
        })
        const data = await response.json()

        if (response.status === 409) {
          // Conta antiga (criada antes da senha existir) — precisa configurar uma senha
          setModo("definir-senha")
          setError(null)
          return
        }
        if (!response.ok) throw new Error(data.detail || "E-mail ou senha incorretos")

        entrarComSessao(data)
      } else if (modo === "definir-senha") {
        const response = await apiFetch(`/usuarios/definir-senha`, {
          method: "POST",
          body: new URLSearchParams({
            email: formData.email.toLowerCase(),
            data_nasc: formData.data_nasc,
            nova_senha: formData.senha,
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.detail || "Não foi possível definir a senha")

        entrarComSessao(data)
      } else {
        // CADASTRO
        const body = new URLSearchParams({
          nome: formData.name,
          email: formData.email.toLowerCase(),
          senha: formData.senha,
          data_nasc: formData.data_nasc,
          escola: formData.escola,
          telefone: formData.telefone.replace(/\D/g, ""),
        })

        const response = await apiFetch(`/usuarios/novo`, { method: "POST", body })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Erro ao cadastrar")
        }

        setModo("login")
        alert("Cadastro realizado com sucesso! Use seu e-mail e senha para entrar.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <HexagonLogo size="lg" />
        </div>
        <h1 className="text-3xl font-bold">
          <span className="text-primary text-glow-cyan">QR</span>
          <span className="text-secondary text-glow-magenta"> Hunt</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          {modo === "login" && "Entre para continuar sua aventura"}
          {modo === "cadastro" && "Crie sua conta e comece a caçar"}
          {modo === "definir-senha" && "Configure uma senha para acessar sua conta"}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 glow-cyan/30">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-lg text-center">{error}</div>}

          {modo === "definir-senha" && (
            <div className="p-3 text-sm bg-primary/10 text-primary rounded-lg text-center">
              Essa conta foi criada antes de existir senha. Confirme sua data de nascimento e escolha uma senha nova.
            </div>
          )}

          {modo === "cadastro" && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10"
                required
              />
            </div>
          </div>

          {modo === "definir-senha" && (
            <div className="space-y-2">
              <Label htmlFor="data_nasc_confirma">Data de Nascimento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="data_nasc_confirma"
                  type="date"
                  value={formData.data_nasc}
                  onChange={(e) => setFormData({ ...formData, data_nasc: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="senha">{modo === "definir-senha" ? "Nova Senha" : "Senha"}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="senha"
                type={showPassword ? "text" : "password"}
                placeholder={modo === "cadastro" ? "Crie uma senha (mín. 8 caracteres)" : "Sua senha"}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="pl-10 pr-10"
                minLength={modo === "login" ? undefined : 8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {modo === "cadastro" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data_nasc">Data de Nascimento</Label>
                <div className="relative">
                  <Input
                    id="data_nasc"
                    type="date"
                    value={formData.data_nasc}
                    onChange={(e) => setFormData({ ...formData, data_nasc: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="escola">Instituição de Ensino</Label>
                <div className="relative">
                  <select
                    id="escola"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.escola}
                    onChange={(e) => setFormData({ ...formData, escola: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {opcoes.escola.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {modo === "cadastro" && (
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (Opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="telefone"
                  placeholder="(98) 9..."
                  value={formData.telefone}
                  onChange={handlePhoneChange}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-secondary py-6 shadow-lg shadow-cyan/20">
            {isLoading
              ? "Processando..."
              : modo === "login" ? "Entrar" : modo === "cadastro" ? "Criar Conta" : "Definir Senha e Entrar"}
            {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </form>

        {modo === "definir-senha" ? (
          <p className="text-center mt-6 text-muted-foreground">
            <button type="button" onClick={() => { setModo("login"); setError(null) }} className="text-primary font-medium hover:underline">
              Voltar para o login
            </button>
          </p>
        ) : (
          <p className="text-center mt-6 text-muted-foreground">
            {modo === "login" ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => { setModo(modo === "login" ? "cadastro" : "login"); setError(null) }}
              className="text-primary font-medium hover:underline"
            >
              {modo === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}