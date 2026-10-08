import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    if (session.user.role !== 'ADMIN' && order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const validPaymentStatuses = ['UNPAID', 'PAID', 'REFUNDED']
const validShippingStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED']

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const data: any = {}
    const now = new Date()

    // Get current order to build history
    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    const history: any[] = Array.isArray(currentOrder.statusHistory)
      ? [...(currentOrder.statusHistory as any[])]
      : []

    if (body.paymentStatus && validPaymentStatuses.includes(body.paymentStatus)) {
      if (body.paymentStatus !== currentOrder.paymentStatus) {
        history.push({
          type: 'payment',
          from: currentOrder.paymentStatus,
          to: body.paymentStatus,
          at: now.toISOString(),
        })
        data.paymentStatus = body.paymentStatus
        data.paymentStatusAt = now
      }
    }

    if (body.shippingStatus && validShippingStatuses.includes(body.shippingStatus)) {
      if (body.shippingStatus !== currentOrder.shippingStatus) {
        history.push({
          type: 'shipping',
          from: currentOrder.shippingStatus,
          to: body.shippingStatus,
          at: now.toISOString(),
        })
        data.shippingStatus = body.shippingStatus
        data.shippingStatusAt = now
      }
    }

    if (history.length > (currentOrder.statusHistory as any[] || []).length) {
      data.statusHistory = history
    }

    // SAV fields
    if (body.savType !== undefined) {
      data.savType = body.savType || null
      data.savAt = body.savType ? now : null
      // Record in history
      if (body.savType) {
        history.push({
          type: 'sav',
          from: currentOrder.savType || 'aucun',
          to: body.savType,
          at: now.toISOString(),
        })
        data.statusHistory = history
      }
    }
    if (body.savReason !== undefined) data.savReason = body.savReason || null
    if (body.savNote !== undefined) data.savNote = body.savNote || null
    if (body.savLoss !== undefined) data.savLoss = body.savLoss !== null ? parseFloat(body.savLoss) : null

    if (Object.keys(data).length === 0) {
      return NextResponse.json(currentOrder)
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  return PATCH(req, context)
}
