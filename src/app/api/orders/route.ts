import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { calculerCommande, validerClient, type ModePaiement } from '@/lib/commande-calcul'
import { chargerCatalogue } from '@/lib/catalogue-serveur'
import { limiteDepassee, ipDe, estRobot, MESSAGE_LIMITE } from '@/lib/limite-essais'
import { sendCustomerEmail, sendAdminEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const paymentStatus = searchParams.get('paymentStatus')
    const shippingStatus = searchParams.get('shippingStatus')

    const where: any = {}

    if (session.user.role === 'ADMIN') {
      if (paymentStatus) where.paymentStatus = paymentStatus
      if (shippingStatus) where.shippingStatus = shippingStatus
    } else {
      where.userId = session.user.id
      if (paymentStatus) where.paymentStatus = paymentStatus
      if (shippingStatus) where.shippingStatus = shippingStatus
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
  let data: Record<string, unknown>
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  // Champ piège rempli = robot : fausse réponse, rien n'est enregistré ni envoyé
  if (estRobot(data)) {
    return NextResponse.json({ orderId: `ORD-${Date.now()}` })
  }

  // 1. Prix, frais de port et total recalculés ICI, depuis la base (08.10.2026).
  //    Les prix envoyés par le navigateur sont ignorés.
  let calcul
  try {
    calcul = calculerCommande(data.items, data.paymentMethod, data.perso as any, await chargerCatalogue())
  } catch (error) {
    console.error('Erreur de calcul de commande :', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  if (!calcul.ok) {
    return NextResponse.json({ error: calcul.erreur, ligne: calcul.ligne }, { status: 400 })
  }
  const paymentMethod = data.paymentMethod as ModePaiement

  const client = validerClient(data, paymentMethod)
  if (!client.ok) {
    return NextResponse.json({ error: client.erreur }, { status: 400 })
  }

  // 2. Limite d'essais : par IP et par adresse e-mail (chaque commande envoie 2 e-mails)
  if (
    await limiteDepassee([
      { portee: 'commande-ip', valeur: ipDe(req), max: 10, fenetreSec: 3600 },
      { portee: 'commande-email', valeur: client.email, max: 6, fenetreSec: 3600 },
    ])
  ) {
    return NextResponse.json({ error: MESSAGE_LIMITE }, { status: 429 })
  }

  const orderId = `ORD-${Date.now()}`

  // Lignes enregistrées (nom, quantité, prix du serveur + de quoi « commander à nouveau »)
  // name = nom du produit (sans prénom) : les statistiques de l'admin regroupent par nom
  const items = calcul.lignes.map((l) => ({
    name: l.nomProduit,
    quantity: l.quantite,
    price: l.prixUnitaire,
    ...(l.productId ? { productId: l.productId } : {}),
    ...(l.config ? { config: l.config } : {}),
  }))

  const emailData = {
    orderId,
    customerName: client.nom,
    customerEmail: client.email,
    customerPhone: client.telephone,
    paymentMethod,
    items: calcul.lignes.map((l) => ({ name: l.nom, quantity: l.quantite, price: l.prixUnitaire })),
    subtotal: calcul.sousTotal,
    shipping: calcul.livraison,
    total: calcul.total,
    personalization: calcul.personnalisation,
    address: client.adresse,
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
        customerName: client.nom,
        customerEmail: client.email,
        customerPhone: client.telephone,
        paymentMethod,
        address: client.adresse || null,
        personalization: calcul.personnalisation || null,
        subtotal: calcul.sousTotal,
        shipping: calcul.livraison,
        total: calcul.total,
        paymentStatus: 'UNPAID',
        shippingStatus: 'PROCESSING',
        items: JSON.parse(JSON.stringify(items)),
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

  // Stripe card payment : montants du SERVEUR uniquement
  if (paymentMethod === 'stripe') {
    try {
      const lineItems = calcul.lignes.map((l) => ({
        price_data: {
          currency: 'chf',
          product_data: { name: l.nom.slice(0, 250) },
          unit_amount: Math.round(l.prixUnitaire * 100),
        },
        quantity: l.quantite,
      }))

      if (calcul.livraison > 0) {
        lineItems.push({
          price_data: {
            currency: 'chf',
            product_data: { name: 'Frais de livraison' },
            unit_amount: Math.round(calcul.livraison * 100),
          },
          quantity: 1,
        })
      }

      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL || 'https://babyboo-creations.ch'}/checkout/confirmation?order=${orderId}`,
        cancel_url: `${process.env.NEXTAUTH_URL || 'https://babyboo-creations.ch'}/panier`,
        metadata: {
          orderId,
          customerName: client.nom,
          customerEmail: client.email,
          customerPhone: client.telephone,
        },
      })

      return NextResponse.json({ orderId, total: calcul.total, checkoutUrl: session.url })
    } catch (error) {
      console.error('Stripe error:', error)
      return NextResponse.json({ orderId, total: calcul.total, error: 'Erreur de paiement' })
    }
  }

  // Twint and cash - return orderId + total calculé par le serveur
  return NextResponse.json({ orderId, total: calcul.total })
}
