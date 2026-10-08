import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()

  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      price: parseFloat(body.price) || 0,
      image: body.image,
      images: body.images || '[]',
      categories: body.categories || '["accessoires"]',
      inStock: body.inStock ?? true,
      featured: body.featured ?? false,
      isNew: body.isNew ?? false,
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  await prisma.product.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
