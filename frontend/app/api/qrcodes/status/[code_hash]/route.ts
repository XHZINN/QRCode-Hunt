import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code_hash: string } }
) {
  const { code_hash } = params

  const { data, error } = await supabase
    .from('qrcodes')
    .update({ ativo: false })
    .eq('code_hash', code_hash)
    .select()

  if (!data || data.length === 0) {
    return NextResponse.json({ detail: 'QR Code não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ status: 'sucesso', mensagem: 'QR Code desativado' })
}
