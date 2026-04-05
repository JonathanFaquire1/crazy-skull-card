import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createServerSupabaseClient()

    const { data: card, error } = await supabase
      .from('cards')
      .select('id, slug')
      .eq('slug', slug)
      .single()

    if (error || !card) {
      return NextResponse.json(
        { error: 'Carte introuvable' },
        { status: 404 }
      )
    }

    const { error: rpcError } = await supabase.rpc('increment_scan', {
      card_slug: slug,
    })

    if (rpcError) {
      console.error('Erreur increment_scan:', rpcError)
      return NextResponse.json(
        { error: 'Erreur incrément scan' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erreur API scan:', err)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}