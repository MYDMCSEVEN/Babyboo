import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'
import { sendCustomerEmail, sendAdminEmail } from '@/lib/email'

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

  // Send emails (don't block the response)
  Promise.all([
    sendCustomerEmail(emailData).catch(console.error),
    sendAdminEmail(emailData).catch(console.error),
  ])

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
