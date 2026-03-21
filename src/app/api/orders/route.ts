import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'
import { sendCustomerEmail, sendAdminEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}

    if (session.user.role === 'ADMIN') {
      // Admin sees all orders
      if (status) where.status = status
    } else {
      // Customer sees only their orders
      where.userId = session.user.id
      if (status) where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json()

  const orderId = `ORD-${Date.now()}`

  // Build items with product names for emails
  const emailItems = data.items.map((item: any) => {
    const product = getProductById(item.productId)
    return {
      name: product?.name || 'Produit Babyboo',
      quantity: item.quantity,
      price: item.price,
    }
  })

  const emailData = {
    orderId,
    customerName: data.name,
    customerEmail: data.email,
    customerPhone: data.phone,
    paymentMethod: data.paymentMethod,
    items: emailItems,
    subtotal: data.subtotal || data.total,
    shipping: data.shipping || 0,
    total: data.total,
    personalization: data.personalization,
    address: data.address,
  }

  // Check if user is authenticated to link order
  let userId: string | null = null
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.id && session.user.id !== 'admin') {
      userId = session.user.id
    }
  } catch {
    // Guest order - no user linked
  }

  // Save order to database
  try {
    await prisma.order.create({
      data: {
        orderId,
        userId,
        customerName: data.name,
        customerEmail: data.email,
        customerPhone: data.phone,
        paymentMethod: data.paymentMethod,
        address: data.address || null,
        personalization: data.personalization || null,
        subtotal: data.subtotal || data.total,
        shipping: data.shipping || 0,
        total: data.total,
        status: 'PENDING',
        items: emailItems,
      },
    })
  } catch (error) {
    console.error('Error saving order to database:', error)
  }

  // Send emails
  try {
    await Promise.all([
      sendCustomerEmail(emailData),
      sendAdminEmail(emailData),
    ])
  } catch (error) {
    console.error('Email error:', error)
  }

  // Stripe card payment
  if (data.paymentMethod === 'stripe') {
    try {
      const lineItems = data.items.map((item: any) => {
        const product = getProductById(item.productId)
        return {
          price_data: {
            currency: 'chf',
            product_data: { name: product?.name || 'Produit Babyboo' },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        }
      })

      // Add shipping as a line item
      if (data.shipping > 0) {
        lineItems.push({
          price_data: {
            currency: 'chf',
            product_data: { name: 'Frais de livraison' },
            unit_amount: Math.round(data.shipping * 100),
          },
          quantity: 1,
        })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL || 'https://babyboo-creations.ch'}/checkout/confirmation?order=${orderId}`,
        cancel_url: `${process.env.NEXTAUTH_URL || 'https://babyboo-creations.ch'}/panier`,
        metadata: {
          orderId,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
        },
      })

      return NextResponse.json({ orderId, checkoutUrl: session.url })
    } catch (error) {
      console.error('Stripe error:', error)
      return NextResponse.json({ orderId, error: 'Erreur de paiement' })
    }
  }

  // Twint and cash - just return orderId
  return NextResponse.json({ orderId })
}
