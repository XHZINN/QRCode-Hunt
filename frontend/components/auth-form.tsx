"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { HexagonLogo } from "@/components/hexagon-logo"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, School, Phone, GraduationCap, BookOpen} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL 

interface AuthFormProps {
  onSuccess?: (userData: any) => void
}

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    escola: "",
    disciplina: "",
    telefone: "",
    status_academico: "",
    curso_interesse: "",
  })

  const [opcoes, setOpcoes] = useState({
    disciplina: [] as string[],
    escola: [] as string[],
    status_academico: [] as string[],
    curso_interesse: [] as string[],
  })

  useEffect(() => {
    async function fetchOpcoes() {
      const enums = ["disciplina", "escola", "status_academico", "curso_interesse"]
      
      const resultados = await Promise.all(
        enums.map((nome) =>
          fetch(`${API_URL}/opcoes/${nome}`)
            .then((r) => r.ok ? r.json() : [])
            .catch(() => [])
        )
      )

      // Garante que cada valor é um array, mesmo se a API retornar algo inesperado
      setOpcoes({
        disciplina:       Array.isArray(resultados[0]) ? resultados[0] : [],
        escola:           Array.isArray(resultados[1]) ? resultados[1] : [],
        status_academico: Array.isArray(resultados[2]) ? resultados[2] : [],
        curso_interesse:  Array.isArray(resultados[3]) ? resultados[3] : [],
      })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isLogin) {
        // LOGIN
        const response = await fetch(`${API_URL}/login`, { method: "POST", body: new URLSearchParams({email: formData.email, data_nasc: formData.password}) })
        if (!response.ok) throw new Error("E-mail ou data de nascimento incorretos")
        const data = await response.json()
        const { data_nasc, telefone, escola, disciplina,
                status_academico, curso_interesse, data_registro, ...safeUser } = data.user
        localStorage.setItem("user_nexp", JSON.stringify(safeUser))
        if (data.user.is_admin) {
            router.push("/admin") // Ou o caminho exato da sua página de admin
        } else {
            onSuccess?.(safeUser) // Vai para a tela de usuário comum
        }
      } else {
        // CADASTRO
        
        const body = new URLSearchParams({
          nome: formData.name,
          email: formData.email,
          data_nasc: formData.password,
          escola: formData.escola,
          disciplina: formData.disciplina,
          telefone: formData.telefone.replace(/\D/g, ""),
        })

        if (formData.escola !== "UNDB") {
          body.append("status_academico", formData.status_academico)
          body.append("curso_interesse", formData.curso_interesse)
        }

        const response = await fetch(`${API_URL}/usuarios/novo`, { method: "POST", body})

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.detail || "Erro ao cadastrar")
        }
        
        setIsLogin(true)
        alert("Cadastro realizado com sucesso! Use sua data de nascimento para entrar.")
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
          {isLogin ? "Entre para continuar sua aventura" : "Crie sua conta e comece a caçar"}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 glow-cyan/30">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-lg text-center">{error}</div>}

          {!isLogin && (
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
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="disciplina">Disciplina</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                <select
                  id="disciplina"
                  value={formData.disciplina}
                  onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>Selecione a disciplina</option>
                  {opcoes.disciplina.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">{isLogin ? "Data Nasc (Senha)" : "Data de Nascimento"}</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={isLogin ? (showPassword ? "text" : "password") : "date"} 
                  placeholder="AAAA-MM-DD" 
                  value={formData.password} 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                  className={isLogin ? "pr-10" : ""}
                  required 
                />
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {!isLogin && (
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
            )}
          </div>

          {!isLogin && (
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

          {!isLogin && formData.escola !== "UNDB" && formData.escola !== "" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label htmlFor="status_academico">Status Academico</Label>
                <div className="relative">
                <select id="status" value={formData.status_academico}
                  onChange={(e) => setFormData({ ...formData, status_academico: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione...</option>
                  {opcoes.status_academico.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="curso_interesse">Curso de Interesse</Label>
                <div className="relative">
                <select id="curso" value={formData.curso_interesse}
                  onChange={(e) => setFormData({ ...formData, curso_interesse: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione...</option>
                  {opcoes.curso_interesse.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-primary to-secondary py-6 shadow-lg shadow-cyan/20">
            {isLoading ? "Processando..." : (isLogin ? "Entrar" : "Criar Conta")}
            {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
          </Button>
        </form>

        <p className="text-center mt-6 text-muted-foreground">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-primary font-medium hover:underline">
            {isLogin ? "Cadastre-se" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  )
}