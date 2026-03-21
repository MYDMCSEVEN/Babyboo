'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCart, clearCart, CartItem, getCartTotal } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

const SHIPPING_COST = 5.90

const inputClass = "w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    paymentMethod: 'twint',
    street: '',
    npa: '',
    city: '',
    canton: '',
    persNames: '',
    persMaterial: [] as string[],
    persColors: '',
    persNote: '',
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

  const toggleMaterial = (mat: string) => {
    setForm(prev => ({
      ...prev,
      persMaterial: prev.persMaterial.includes(mat)
        ? prev.persMaterial.filter(m => m !== mat)
        : [...prev.persMaterial, mat],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const address = isPickup ? '' : `${form.street}, ${form.npa} ${form.city}, ${form.canton}`
    const personalization = [
      form.persNames ? `Prénom(s) : ${form.persNames}` : '',
      form.persMaterial.length > 0 ? `Matériaux : ${form.persMaterial.join(' + ')}` : '',
      form.persColors ? `Couleur(s) : ${form.persColors}` : '',
      form.persNote ? `Note : ${form.persNote}` : '',
    ].filter(Boolean).join('\n')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          paymentMethod: form.paymentMethod,
          address,
          personalization,
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
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Téléphone *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* Adresse de livraison — champs séparés */}
        {!isPickup && (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-baby-text">Adresse de livraison</h3>
            <div>
              <label className="block text-sm font-medium text-baby-text mb-1">Rue et numéro *</label>
              <input
                type="text"
                required
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className={inputClass}
                placeholder="Ex: Rue de la Blancherie 35"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">NPA *</label>
                <input
                  type="text"
                  required
                  value={form.npa}
                  onChange={(e) => setForm({ ...form, npa: e.target.value })}
                  className={inputClass}
                  placeholder="1920"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Ville *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputClass}
                  placeholder="Martigny"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-baby-text mb-1">Canton *</label>
              <select
                required
                value={form.canton}
                onChange={(e) => setForm({ ...form, canton: e.target.value })}
                className={inputClass}
              >
                <option value="">Sélectionner un canton</option>
                <option value="AG">Argovie (AG)</option>
                <option value="AI">Appenzell Rhodes-Intérieures (AI)</option>
                <option value="AR">Appenzell Rhodes-Extérieures (AR)</option>
                <option value="BE">Berne (BE)</option>
                <option value="BL">Bâle-Campagne (BL)</option>
                <option value="BS">Bâle-Ville (BS)</option>
                <option value="FR">Fribourg (FR)</option>
                <option value="GE">Genève (GE)</option>
                <option value="GL">Glaris (GL)</option>
                <option value="GR">Grisons (GR)</option>
                <option value="JU">Jura (JU)</option>
                <option value="LU">Lucerne (LU)</option>
                <option value="NE">Neuchâtel (NE)</option>
                <option value="NW">Nidwald (NW)</option>
                <option value="OW">Obwald (OW)</option>
                <option value="SG">Saint-Gall (SG)</option>
                <option value="SH">Schaffhouse (SH)</option>
                <option value="SO">Soleure (SO)</option>
                <option value="SZ">Schwyz (SZ)</option>
                <option value="TG">Thurgovie (TG)</option>
                <option value="TI">Tessin (TI)</option>
                <option value="UR">Uri (UR)</option>
                <option value="VD">Vaud (VD)</option>
                <option value="VS">Valais (VS)</option>
                <option value="ZG">Zoug (ZG)</option>
                <option value="ZH">Zurich (ZH)</option>
              </select>
            </div>
          </div>
        )}

        {/* Personnalisation */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg text-baby-text">Personnalisation</h3>

          <div>
            <label className="block text-sm font-medium text-baby-text mb-1">Prénom(s) à inscrire *</label>
            <input
              type="text"
              required
              value={form.persNames}
              onChange={(e) => setForm({ ...form, persNames: e.target.value })}
              className={inputClass}
              placeholder="Ex: EMMA, LÉO"
            />
            <p className="text-xs text-baby-text/50 mt-1">Séparez les prénoms par une virgule si plusieurs</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-baby-text mb-2">Matériaux souhaités *</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-baby-brown/20 cursor-pointer hover:bg-baby-beige transition">
                <input
                  type="checkbox"
                  checked={form.persMaterial.includes('Silicone alimentaire')}
                  onChange={() => toggleMaterial('Silicone alimentaire')}
                  className="w-4 h-4 text-baby-rose rounded"
                />
                <span className="text-2xl">🫧</span>
                <div>
                  <span className="font-medium">Silicone alimentaire</span>
                  <span className="text-sm text-baby-text/60 ml-2">Sans BPA, non toxique</span>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-baby-brown/20 cursor-pointer hover:bg-baby-beige transition">
                <input
                  type="checkbox"
                  checked={form.persMaterial.includes('Bois naturel')}
                  onChange={() => toggleMaterial('Bois naturel')}
                  className="w-4 h-4 text-baby-rose rounded"
                />
                <span className="text-2xl">🪵</span>
                <div>
                  <span className="font-medium">Bois naturel</span>
                  <span className="text-sm text-baby-text/60 ml-2">Non traité, poncé</span>
                </div>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg border border-baby-brown/20 cursor-pointer hover:bg-baby-beige transition">
                <input
                  type="checkbox"
                  checked={form.persMaterial.includes('Mélange silicone + bois')}
                  onChange={() => toggleMaterial('Mélange silicone + bois')}
                  className="w-4 h-4 text-baby-rose rounded"
                />
                <span className="text-2xl">✨</span>
                <div>
                  <span className="font-medium">Mélange silicone + bois</span>
                  <span className="text-sm text-baby-text/60 ml-2">Le meilleur des deux</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-baby-text mb-1">Couleur(s) souhaitée(s) *</label>
            <input
              type="text"
              required
              value={form.persColors}
              onChange={(e) => setForm({ ...form, persColors: e.target.value })}
              className={inputClass}
              placeholder="Ex: Rose, blanc, bleu ciel"
            />
            <p className="text-xs text-baby-text/50 mt-1">Indiquez une ou plusieurs couleurs séparées par des virgules</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-baby-text mb-1">Note particulière (style, demande spéciale...)</label>
            <textarea
              value={form.persNote}
              onChange={(e) => setForm({ ...form, persNote: e.target.value })}
              rows={2}
              className={inputClass}
              placeholder="Ex: Perles roses et blanches, style fleuri..."
            />
          </div>
        </div>

        {/* Mode de paiement */}
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
