import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import QRCode from 'qrcode'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const nome_local = searchParams.get('nome_local') || ''
  const pontos = parseInt(searchParams.get('pontos') || '0')

  const dadosHash = `${nome_local}-${pontos}${randomBytes(4).toString('hex')}`
  const codeHash = createHash('sha256').update(dadosHash).digest('hex').slice(0, 12)

  await supabase.from('qrcodes').insert({
    code_hash: codeHash,
    pontos,
    local: nome_local,
  })

  // Gera QR Code como PNG em buffer (sem salvar em disco — Vercel é serverless)
  const pngBuffer = await QRCode.toBuffer(codeHash, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
  })

  return new NextResponse(pngBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="QR_${nome_local}.png"`,
    },
  })
}
