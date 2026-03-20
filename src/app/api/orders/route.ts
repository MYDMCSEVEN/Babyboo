import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  // For admin dashboard
  const orders = await prisma.order.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const data = await req.json()

  const order = await prisma.order.create({
    data: {
      customerName: data.name,
      customerEmail: data.email,
      customerPhone: data.phone,
      total: data.total,
      paymentMethod: data.paymentMethod,
      items: {
        create: data.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
  })

  // If Stripe payment, create checkout session
  if (data.paymentMethod === 'stripe') {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: data.items.map((item: any) => ({
          price_data: {
            currency: 'chf',
            product_data: { name: `Commande #${order.id.slice(-6)}` },
            unit_amount: Math.round(data.total * 100),
          },
          quantity: 1,
        })),
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL}/checkout/confirmation?order=${order.id}`,
        cancel_url: `${process.env.NEXTAUTH_URL}/panier`,
        metadata: { orderId: order.id },
      })

      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: session.id },
      })

      return NextResponse.json({ orderId: order.id, checkoutUrl: session.url })
    } catch (error) {
      // If Stripe fails, still return the order (they can pay another way)
      return NextResponse.json({ orderId: order.id })
    }
  }

  return NextResponse.json({ orderId: order.id })
}
