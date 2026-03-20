import { NextRequest, NextResponse } from 'next/server'
import { getProductById } from '@/lib/products'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const product = getProductById(params.id)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT() {
  return NextResponse.json({ error: 'Modification des produits non disponible en mode statique. Modifiez src/lib/products.ts directement.' }, { status: 501 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Suppression non disponible en mode statique.' }, { status: 501 })
}
