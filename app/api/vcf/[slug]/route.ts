import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '../../../../lib/supabase-server'
import { generateVCF } from '../../../../lib/vcf'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createServerSupabaseClient()

    const { data: card, error } = await supabase
      .from('cards')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !card) {
      return NextResponse.json(
        { error: 'Carte introuvable' },
        { status: 404 }
      )
    }

    const { error: rpcError } = await supabase.rpc('increment_save', {
      card_slug: slug,
    })

    if (rpcError) {
      console.error('Erreur increment_save:', rpcError)
    }

    const vcf = await generateVCF(card)

    return new NextResponse(vcf, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${card.firstname}_${card.lastname}.vcf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Erreur API VCF:', err)

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}