import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const data = await req.json()
  const slug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      description: data.description || '',
      price: parseFloat(data.price),
      image: data.image || '/images/placeholder.jpg',
      images: data.images || '[]',
      category: data.category || 'accessoires',
      inStock: data.inStock !== false,
      featured: data.featured === true,
    },
  })

  return NextResponse.json(product)
}
