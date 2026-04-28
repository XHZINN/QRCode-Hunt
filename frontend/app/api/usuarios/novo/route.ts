import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

function validarEmail(email: string): boolean {
  const padrao = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
  return padrao.test(email.toLowerCase())
}

function validarNome(nome: string): { valido: boolean; msg: string } {
  if (/\d/.test(nome)) return { valido: false, msg: 'O nome não pode conter números.' }
  if (nome.trim().length < 3) return { valido: false, msg: 'Nome muito curto.' }
  return { valido: true, msg: '' }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const nome = searchParams.get('nome') || ''
  const email = searchParams.get('email') || ''
  const data_nasc = searchParams.get('data_nasc') || ''
  const telefone = searchParams.get('telefone') || ''
  const status_a = searchParams.get('status_a') || ''
  const escola = searchParams.get('escola') || ''
  const curso_interesse = searchParams.get('curso_interesse') || ''

  const nomeValido = validarNome(nome)
  if (!nomeValido.valido) return NextResponse.json({ detail: nomeValido.msg }, { status: 400 })

  if (!validarEmail(email)) return NextResponse.json({ detail: 'E-mail inválido.' }, { status: 400 })

  const dataNasc = new Date(data_nasc)
  const idade = Math.floor((Date.now() - dataNasc.getTime()) / (1000 * 60 * 60 * 24 * 365))
  if (idade < 15) return NextResponse.json({ detail: 'Você precisa ter pelo menos 15 anos.' }, { status: 400 })

  const dadosUser = {
    id_user: uuidv4(),
    nome: nome.replace(/\b\w/g, c => c.toUpperCase()),
    data_nasc,
    email: email.toLowerCase().trim(),
    telefone,
    status_academico: status_a,
    escola,
    curso_interesse,
    pontos: 0,
    data_registro: new Date().toISOString(),
  }

  try {
    const { data, error } = await supabase.table('users').insert(dadosUser).select()
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ detail: 'Este e-mail já está cadastrado em nossa base.' }, { status: 400 })
      }
      throw error
    }
    return NextResponse.json({ status: 'Sucesso', user: data[0] })
  } catch (e: any) {
    return NextResponse.json({ detail: 'Erro interno no servidor ao realizar cadastro.' }, { status: 500 })
  }
}
