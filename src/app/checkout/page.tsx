'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCart, clearCart, CartItem, getCartTotal } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

const SHIPPING_COST = 5.90

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'twint',
    address: '',
    personalization: '',
  })

  useEffect(() => {
    const c = getCart()
    if (c.length === 0) router.push('/panier')
    setCart(c)
  }, [router])

  const subtotal = getCartTotal(cart)
  const isPickup = form.paymentMethod === 'cash'
  const shipping = isPickup ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          subtotal,
          shipping,
          total,
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la commande')

      const data = await res.json()

      if (form.paymentMethod === 'stripe' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      if (form.paymentMethod === 'twint') {
        clearCart()
        router.push(`/checkout/twint?order=${data.orderId}`)
        return
      }

      clearCart()
      router.push(`/checkout/confirmation?order=${data.orderId}`)
    } catch (error) {
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl text-baby-text mb-8">Finaliser la commande</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-serif text-xl text-baby-text mb-4">Récapitulatif</h2>
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between py-2 border-b last:border-0">
            <span>{item.name} x{item.quantity}</span>
            <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 border-b text-baby-text/70">
          <span>Sous-total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between py-2 border-b text-baby-text/70">
          <span>Livraison</span>
          <span>{isPickup ? 'Gratuit (retrait)' : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between pt-4 text-xl font-bold">
          <span>Total</span>
          <span className="text-baby-rose">{formatPrice(total)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="font-serif text-xl text-baby-text">Vos informations</h2>

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Nom complet *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Téléphone *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
          />
        </div>

        {!isPickup && (
          <div>
            <label className="block text-sm font-medium text-baby-text mb-1">Adresse de livraison *</label>
            <textarea
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
              placeholder="Rue, NPA, Ville"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Personnalisation (prénom, couleurs...)</label>
          <textarea
            value={form.personalization}
            onChange={(e) => setForm({ ...form, personalization: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
            placeholder="Ex: Prénom EMMA, perles roses et blanches"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-baby-text mb-3">Mode de paiement *</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 rounded-lg border border-baby-brown/20 cursor-pointer hover:bg-baby-beige transition">
              <input
                type="radio"
                name="payment"
                value="twint"
                checked={form.paymentMethod === 'twint'}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="text-baby-rose"
              />
              <div>
                <span className="font-medium">Twint</span>
                <span className="text-sm text-baby-text/60 ml-2">Envoi postal — 5.90 CHF</span>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-3 rounded-lg border border-baby-brown/20 cursor-pointer hover:bg-baby-beige transition">
              <input
                type="radio"
                name="payment"
                value="stripe"
                checked={form.paymentMethod === 'stripe'}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="text-baby-rose"
              />
              <div>
                <span className="font-medium">Carte bancaire</span>
                <span className="text-sm text-baby-text/60 ml-2">Visa, Mastercard — Envoi postal — 5.90 CHF</span>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-3 rounded-lg border border-baby-brown/20 cursor-pointer hover:bg-baby-beige transition">
              <input
                type="radio"
                name="payment"
                value="cash"
                checked={form.paymentMethod === 'cash'}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="text-baby-rose"
              />
              <div>
                <span className="font-medium">Espèces</span>
                <span className="text-sm text-baby-text/60 ml-2">Retrait gratuit à Fully (VS)</span>
              </div>
            </label>
          </div>
        </div>

        {isPickup && (
          <div className="bg-baby-beige rounded-lg p-4 text-sm text-baby-text/70">
            <strong>Retrait à Fully (VS)</strong> — Vous serez contacté(e) pour convenir d&apos;un rendez-vous.
          </div>
        )}

        {!isPickup && (
          <div className="bg-baby-beige rounded-lg p-4 text-sm text-baby-text/70">
            L&apos;envoi sera effectué dès réception du paiement. Délai de livraison : <strong>7 jours ouvrables</strong>.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Traitement en cours...' : `Commander — ${formatPrice(total)}`}
        </button>
      </form>
    </div>
  )
}
