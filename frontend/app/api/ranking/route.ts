import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export async function GET() {
  const { data } = await supabase
    .from('users')
    .select('id_user, nome, pontos, catch(count)')
    .eq('is_admin', false)
    .order('pontos', { ascending: false })
    .limit(10)

  const ranking = (data ?? []).map((user: any) => ({
    id: user.id_user,
    nome: user.nome,
    pontos: user.pontos,
    qrs_capturados: user.catch?.[0]?.count ?? 0,
  }))

  return NextResponse.json(ranking)
}
