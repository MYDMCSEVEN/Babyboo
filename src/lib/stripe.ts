import Stripe from 'stripe'

// Client Stripe créé à la demande (08.10.2026) : si STRIPE_SECRET_KEY manque,
// seul le paiement par carte échoue (Twint et espèces continuent de marcher).
let client: Stripe | null = null

export function getStripe(): Stripe {
  if (!client) {
    const cle = process.env.STRIPE_SECRET_KEY
    if (!cle) throw new Error('STRIPE_SECRET_KEY absent de la configuration')
    client = new Stripe(cle, { apiVersion: '2024-12-18.acacia' as any })
  }
  return client
}
