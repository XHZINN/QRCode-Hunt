const API_URL = process.env.NEXT_PUBLIC_API_URL

const TOKEN_KEY = "auth_token"
const USER_KEY = "user_nexp"

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getStoredUser(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function salvarSessao(user: any, token: string) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, token)
}

export function limparSessao() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Wrapper de fetch que injeta o Bearer token em toda chamada autenticada e
 * derruba a sessão automaticamente se o token expirar/for inválido (401).
 *
 * Importante: só faz o redirect automático quando a chamada JÁ tinha um token
 * anexado — um 401 sem token (ex: senha errada em /login) é resposta normal
 * de credencial inválida, não sessão expirada, e deve ser tratado por quem chamou.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401 && token && typeof window !== "undefined") {
    limparSessao()
    window.location.href = "/"
  }

  return res
}

/**
 * Baixa um arquivo de uma rota autenticada (ex: exportação de dados) — não dá
 * pra usar window.open aqui porque uma navegação de browser não carrega o
 * header Authorization.
 */
export async function baixarArquivoAutenticado(path: string, nomeArquivoFallback: string) {
  const res = await apiFetch(path)
  if (!res.ok) {
    const erro = await res.json().catch(() => null)
    throw new Error(erro?.detail || "Erro ao baixar arquivo.")
  }

  const blob = await res.blob()
  const disposition = res.headers.get("Content-Disposition") || ""
  const match = disposition.match(/filename=([^;]+)/)
  const nomeArquivo = match ? match[1].trim() : nomeArquivoFallback

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
