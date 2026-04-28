import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email') || ''
  const data_nasc = searchParams.get('data_nasc') || ''

  // Valida formato de data básico
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data_nasc)) {
    return NextResponse.json(
      { detail: 'Formato de data inválido. Use AAAA-MM-DD' },
      { status: 400 }
    )
  }

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('data_nasc', data_nasc)

  if (data && data.length > 0) {
    return NextResponse.json({ user: data[0] })
  }

  return NextResponse.json(
    { detail: 'E-mail ou data incorretos' },
    { status: 401 }
  )
}
