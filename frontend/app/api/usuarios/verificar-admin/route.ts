import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email') || ''

  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('email', email)
    .single()

  return NextResponse.json({ is_admin: data?.is_admin ?? false })
}
