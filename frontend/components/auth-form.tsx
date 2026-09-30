"use client"

import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, School, ArrowLeft, ChevronDown } from "lucide-react"
import { apiFetch, salvarSessao } from "@/lib/api"
import { cn } from "@/lib/utils"
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap"
import { Wordmark, SoftwareHouseLogo } from "@/components/itw/brand"
import { PrimaryButton } from "@/components/itw/ui"
import { PixelStars, OrbitRings, StripeBundle, XMarks, EventTicker, TypeTag, Kicker } from "@/components/itw/decor"

// three.js só é baixado na tela de login e só no cliente
const VoxelGlobe = dynamic(() => import("@/components/itw/voxel-globe"), { ssr: false })

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
  const rootRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

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

  // Entrada da tela
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } })
      tl.from("[data-wm]", { yPercent: 60, opacity: 0, duration: 1.1, stagger: 0.09 }, 0.35)
        .from("[data-panel]", { y: 40, opacity: 0, duration: 1 }, 0.55)
        .from("[data-decor]", { opacity: 0, duration: 1.4, stagger: 0.1 }, 0.2)
    },
    { scope: rootRef },
  )

  // Troca de modo: campos entram em sequência
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      gsap.from("[data-field]", { y: 14, opacity: 0, duration: 0.5, stagger: 0.05, ease: "power3.out", clearProps: "all" })
    },
    { scope: formRef, dependencies: [modo] },
  )

  const trocarModo = (novo: Modo) => {
    setModo(novo)
    setError(null)
  }

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
        toast.success("Conta criada!", { description: "Use seu e-mail e senha para entrar." })
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const submitLabel = modo === "login" ? "Entrar" : modo === "cadastro" ? "Criar conta" : "Definir senha e entrar"

  return (
    <div ref={rootRef} className="relative min-h-dvh overflow-x-hidden bg-ink">
      {/* ── fundo ── */}
      <div data-decor className="absolute inset-0">
        <PixelStars count={36} seed={3} />
      </div>
      <div data-decor>
        <OrbitRings size={340} className="-left-44 -top-40 opacity-80" />
      </div>
      <div data-decor>
        <StripeBundle lines={6} className="right-5 top-0 h-72" />
      </div>
      <div data-decor>
        <OrbitRings size={260} className="-right-36 top-[330px] opacity-60" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col pt-safe">
        {/* ── hero ── */}
        <section className="relative px-6 pt-8">
          <div className="text-center">
            <TypeTag text="<hello world />" className="text-[15px] text-white/90" />
          </div>

          <div
            className="relative mx-auto -mt-2 h-[300px] w-full"
            style={{
              maskImage: "linear-gradient(to bottom, black 55%, transparent 96%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent 96%)",
            }}
          >
            <VoxelGlobe className="h-full w-full" />
          </div>

          <div className="relative z-10 -mt-[132px]">
            <Wordmark />
            <div data-decor className="absolute bottom-[3px] right-0">
              <XMarks vertical={false} size={11} />
            </div>
          </div>
        </section>

        {/* ── formulário ── */}
        <section data-panel className="relative z-10 mt-8 flex-1 px-5 pb-8">
          {modo === "definir-senha" ? (
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => trocarModo("login")}
                className="flex h-10 w-10 items-center justify-center border border-line-strong text-muted-foreground active:scale-95"
                aria-label="Voltar para o login"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <Kicker>conta antiga</Kicker>
                <p className="font-display text-lg font-bold uppercase">Criar senha</p>
              </div>
            </div>
          ) : (
            <ModeSwitch modo={modo} onChange={trocarModo} />
          )}

          <form ref={formRef} onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div data-field role="alert" className="border-l-2 border-crimson bg-crimson/10 px-4 py-3 text-sm text-[#ff8fb0]">
                {error}
              </div>
            )}

            {modo === "definir-senha" && (
              <p data-field className="border-l-2 border-cyan bg-cyan/5 px-4 py-3 text-sm leading-relaxed text-foreground/80">
                Essa conta foi criada antes de existir senha. Confirme sua data de nascimento e escolha uma senha nova.
              </p>
            )}

            {modo === "cadastro" && (
              <Field label="Nome completo" htmlFor="name" icon={<User />}>
                <input
                  id="name"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputCls}
                  required
                />
              </Field>
            )}

            <Field label="E-mail" htmlFor="email" icon={<Mail />}>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputCls}
                required
              />
            </Field>

            {modo === "definir-senha" && (
              <Field label="Data de nascimento" htmlFor="data_nasc_confirma" icon={<Calendar />}>
                <input
                  id="data_nasc_confirma"
                  type="date"
                  value={formData.data_nasc}
                  onChange={(e) => setFormData({ ...formData, data_nasc: e.target.value })}
                  className={inputCls}
                  required
                />
              </Field>
            )}

            <Field label={modo === "definir-senha" ? "Nova senha" : "Senha"} htmlFor="senha" icon={<Lock />}>
              <input
                id="senha"
                type={showPassword ? "text" : "password"}
                autoComplete={modo === "login" ? "current-password" : "new-password"}
                placeholder={modo === "cadastro" ? "Mínimo 8 caracteres" : "Sua senha"}
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className={cn(inputCls, "pr-12")}
                minLength={modo === "login" ? undefined : 8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-muted-foreground active:text-cyan"
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            {modo === "cadastro" && (
              <>
                <Field label="Data de nascimento" htmlFor="data_nasc" icon={<Calendar />}>
                  <input
                    id="data_nasc"
                    type="date"
                    value={formData.data_nasc}
                    onChange={(e) => setFormData({ ...formData, data_nasc: e.target.value })}
                    className={inputCls}
                    required
                  />
                </Field>

                <Field label="Instituição de ensino" htmlFor="escola" icon={<School />}>
                  <select
                    id="escola"
                    className={cn(inputCls, "appearance-none pr-10", !formData.escola && "text-muted-foreground")}
                    value={formData.escola}
                    onChange={(e) => setFormData({ ...formData, escola: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {opcoes.escola.map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </Field>

                <Field label="Telefone" hint="opcional" htmlFor="telefone" icon={<Phone />}>
                  <input
                    id="telefone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="(98) 9 0000-0000"
                    value={formData.telefone}
                    onChange={handlePhoneChange}
                    className={inputCls}
                  />
                </Field>
              </>
            )}

            <div data-field className="pt-2">
              <PrimaryButton type="submit" loading={isLoading}>
                {submitLabel}
              </PrimaryButton>
            </div>
          </form>
        </section>

        {/* ── assinatura ── */}
        <footer className="relative z-10 pb-safe">
          <div className="flex items-center justify-center gap-5 px-6 pb-5 pt-2">
            <div className="flex items-center gap-2.5">
              <SoftwareHouseLogo className="h-11 w-11" />
              <span className="font-display text-[10px] font-bold uppercase leading-tight tracking-wider text-white/85">
                Software
                <br />
                House
              </span>
            </div>
            <span className="h-8 w-px bg-line-strong" />
            <div className="flex flex-col">
              <span className="font-display text-base font-black tracking-[0.18em] text-white">UNDB</span>
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground">Escola de Tecnologia</span>
            </div>
          </div>
          <EventTicker />
        </footer>
      </div>
    </div>
  )
}

/* ───────────────────────── peças do formulário ───────────────────────── */

const inputCls =
  "peer h-12 w-full border border-line-strong bg-surface pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-cyan focus:bg-surface-2 rounded-none [color-scheme:dark]"

function Field({
  label,
  hint,
  htmlFor,
  icon,
  children,
}: {
  label: string
  hint?: string
  htmlFor: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div data-field className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label}
        {hint && <span className="normal-case tracking-normal text-muted-foreground/60">{hint}</span>}
      </label>
      <div className="relative [&>svg:first-child]:pointer-events-none [&>svg:first-child]:absolute [&>svg:first-child]:left-4 [&>svg:first-child]:top-1/2 [&>svg:first-child]:h-4 [&>svg:first-child]:w-4 [&>svg:first-child]:-translate-y-1/2 [&>svg:first-child]:text-muted-foreground [&:focus-within>svg:first-child]:text-cyan">
        {icon}
        {children}
      </div>
    </div>
  )
}

function ModeSwitch({ modo, onChange }: { modo: Modo; onChange: (m: Modo) => void }) {
  const idx = modo === "cadastro" ? 1 : 0
  return (
    <div className="relative grid grid-cols-2 border border-line-strong bg-surface p-1" role="tablist">
      <span
        aria-hidden
        className="absolute bottom-1 top-1 w-[calc(50%-4px)] bg-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(${idx * 100}%)`, left: 4 }}
      />
      {(["login", "cadastro"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={modo === m}
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 h-11 font-display text-[12px] font-bold uppercase tracking-[0.12em] transition-colors duration-300",
            modo === m ? "text-ink" : "text-muted-foreground",
          )}
        >
          {m === "login" ? "Entrar" : "Criar conta"}
        </button>
      ))}
    </div>
  )
}
