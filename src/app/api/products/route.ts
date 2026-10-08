import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await req.json()

  // Generate slug from name
  const slug = body.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      description: body.description || '',
      price: parseFloat(body.price) || 0,
      image: body.image || '/images/placeholder.jpg',
      images: body.images || '[]',
      categories: body.categories || '["accessoires"]',
      inStock: body.inStock ?? true,
      featured: body.featured ?? false,
      isNew: body.isNew ?? false,
    },
  })

  return NextResponse.json(product)
}
