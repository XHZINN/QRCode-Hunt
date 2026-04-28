import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export async function GET() {
  const { data } = await supabase.from('qrcodes').select('*')
  return NextResponse.json(data ?? [])
}
