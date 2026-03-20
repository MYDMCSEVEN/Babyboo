import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'

export async function POST(req: NextRequest) {
  const data = await req.json()

  const orderId = `ORD-${Date.now()}`

  // Build line items with real product names
  const lineItems = data.items.map((item: any) => {
    const product = getProductById(item.productId)
    return {
      price_data: {
        currency: 'chf',
        product_data: { name: product?.name || `Produit Babyboo` },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }
  })

  if (data.paymentMethod === 'stripe' || data.paymentMethod === 'twint') {
    try {
      const paymentMethods = data.paymentMethod === 'twint'
        ? ['twint' as const]
        : ['card' as const, 'twint' as const]

      const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentMethods,
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL || 'https://babyboo-creations.ch'}/checkout/confirmation?order=${orderId}`,
        cancel_url: `${process.env.NEXTAUTH_URL || 'https://babyboo-creations.ch'}/panier`,
        metadata: {
          orderId,
          customerName: data.name,
          customerEmail: data.email,
          customerPhone: data.phone,
          personalization: data.personalization || '',
        },
      })

      return NextResponse.json({ orderId, checkoutUrl: session.url })
    } catch (error) {
      console.error('Stripe error:', error)
      return NextResponse.json({ orderId, error: 'Erreur de paiement' })
    }
  }

  // Cash payment - just return orderId
  return NextResponse.json({ orderId })
}
