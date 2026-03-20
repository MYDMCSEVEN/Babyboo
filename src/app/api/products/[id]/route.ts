import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const data = await req.json()
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: data.name,
      description: data.description,
      price: parseFloat(data.price),
      image: data.image,
      images: data.images,
      category: data.category,
      inStock: data.inStock,
      featured: data.featured,
    },
  })

  return NextResponse.json(product)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  await prisma.product.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
