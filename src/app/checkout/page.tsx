'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCart, clearCart, CartItem, getCartTotal } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'twint',
    personalization: '',
  })

  useEffect(() => {
    const c = getCart()
    if (c.length === 0) router.push('/panier')
    setCart(c)
  }, [router])

  const total = getCartTotal(cart)

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
          total,
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de la commande')

      const data = await res.json()

      if ((form.paymentMethod === 'stripe' || form.paymentMethod === 'twint') && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
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

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Personnalisation (prénom, couleurs...)</label>
          <textarea
            value={form.personalization}
            onChange={(e) => setForm({ ...form, personalization: e.target.value })}
            rows={3}
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
              <span>Twint</span>
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
              <span>Carte bancaire (Visa, Mastercard)</span>
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
              <span>Espèces (au retrait)</span>
            </label>
          </div>
        </div>

        <p className="text-sm text-baby-text/50">
          Retrait en Suisse uniquement. Vous serez contacté(e) pour organiser le retrait.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Traitement en cours...' : `Commander - ${formatPrice(total)}`}
        </button>
      </form>
    </div>
  )
}
