import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData()
    const user_id = body.get('user_id') as string
    const code_hash = body.get('code_hash') as string

    // 1. Busca pontos do QR
    const { data: qrData } = await supabase
      .from('qrcodes')
      .select('pontos')
      .eq('code_hash', code_hash)
      .single()

    if (!qrData) {
      return NextResponse.json({ status: 'Erro', msg: 'QR Code não encontrado.' })
    }

    const valor_pontos = qrData.pontos

    // 2. Registra a captura
    const { error } = await supabase.from('catch').insert({
      id_catch: uuidv4(),
      id_user: user_id,
      catch_time: new Date().toISOString(),
      code_hash,
    })

    if (error) {
      const msg = error.message.includes('duplicate')
        ? 'Você já capturou este código!'
        : 'Erro na captura.'
      return NextResponse.json({ status: 'Erro', msg })
    }

    return NextResponse.json({ status: 'Sucesso', pontos: valor_pontos })
  } catch (e: any) {
    return NextResponse.json({ status: 'Erro', msg: 'Erro interno.' })
  }
}
