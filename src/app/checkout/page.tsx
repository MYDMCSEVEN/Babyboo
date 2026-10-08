'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getCart, clearCart, CartItem, getCartTotal } from '@/lib/cart'
import { formatPrice } from '@/lib/format'
import { lookupNpa } from '@/lib/npa-swiss'
import ChampPiege from '@/components/ChampPiege'
import { CHAMP_PIEGE } from '@/lib/champ-piege'

const SHIPPING_COST = 5.90

// Montants calculés par le serveur (08.10.2026) : ce sont eux qui sont facturés
interface Devis {
  lignes: { nom: string; quantite: number; prixUnitaire: number; total: number }[]
  sousTotal: number
  livraison: number
  total: number
}

// Ce que le navigateur envoie : identifiants / configuration + quantités, jamais de prix
function articlesPourServeur(cart: CartItem[]) {
  return cart.map((item) =>
    item.config
      ? { config: item.config, quantity: item.quantity }
      : { productId: item.productId || item.id, quantity: item.quantity, ...(item.customDescription ? { note: item.customDescription } : {}) }
  )
}

const inputClass = "w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50"

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [useSavedAddress, setUseSavedAddress] = useState(true)
  const [savedAddress, setSavedAddress] = useState<string | null>(null)
  const [devis, setDevis] = useState<Devis | null>(null)
  const [erreurDevis, setErreurDevis] = useState<{ message: string; ligne?: number } | null>(null)
  const [piege, setPiege] = useState('')
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

  // Auto-fill from user profile when logged in
  useEffect(() => {
    if (session?.user && !profileLoaded) {
      fetch('/api/profile')
        .then(res => res.ok ? res.json() : null)
        .then(profile => {
          if (profile) {
            setForm(prev => ({
              ...prev,
              name: prev.name || profile.name || '',
              email: prev.email || profile.email || '',
              phone: prev.phone || profile.phone || '',
            }))
            if (profile.address) {
              setSavedAddress(profile.address)
              // Parse address into fields
              const parts = profile.address.split(',').map((s: string) => s.trim())
              if (parts.length >= 3) {
                const cityPart = parts[1]
                const npaMatch = cityPart.match(/^(\d+)\s*(.*)$/)
                setForm(prev => ({
                  ...prev,
                  street: prev.street || parts[0],
                  npa: prev.npa || (npaMatch ? npaMatch[1] : ''),
                  city: prev.city || (npaMatch ? npaMatch[2] : cityPart),
                  canton: prev.canton || parts[2],
                }))
              }
            }
            setProfileLoaded(true)
          }
        })
        .catch(() => {})
    }
  }, [session, profileLoaded])

  // Check if ALL items are already personalized (from configurator)
  const allPersonalized = cart.length > 0 && cart.every((item) => !!item.customDescription)
  // Check if SOME items are personalized
  const somePersonalized = cart.some((item) => !!item.customDescription)
  // Items that still need personalization
  const needsPersonalization = cart.some((item) => !item.customDescription)

  const isPickup = form.paymentMethod === 'cash'
  // Affichage : montants du serveur dès qu'ils sont connus (sinon estimation du panier)
  const subtotal = devis ? devis.sousTotal : getCartTotal(cart)
  const shipping = devis ? devis.livraison : isPickup ? 0 : SHIPPING_COST
  const total = devis ? devis.total : subtotal + shipping

  // Devis du serveur à chaque changement de panier ou de mode de paiement
  useEffect(() => {
    if (cart.length === 0) return
    let annule = false
    setDevis(null)
    fetch('/api/orders/devis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: articlesPourServeur(cart), paymentMethod: form.paymentMethod }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (annule) return
        if (res.ok) {
          setDevis(data)
          setErreurDevis(null)
        } else {
          setErreurDevis({ message: data.error || 'Impossible de calculer le total', ligne: data.ligne })
        }
      })
      .catch(() => {
        if (!annule) setErreurDevis({ message: 'Impossible de calculer le total. Réessayez.' })
      })
    return () => {
      annule = true
    }
  }, [cart, form.paymentMethod])

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
          // Champs de personnalisation (texte libre) : le serveur reconstruit le récapitulatif
          perso: allPersonalized
            ? { note: form.persNote }
            : { noms: form.persNames, materiaux: form.persMaterial, couleurs: form.persColors, note: form.persNote },
          // Identifiants + quantités seulement : le serveur recalcule tous les prix
          items: articlesPourServeur(cart),
          [CHAMP_PIEGE]: piege,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || 'Une erreur est survenue. Veuillez réessayer.')
        setLoading(false)
        return
      }

      // Total du serveur, affiché sur la page Twint
      try {
        sessionStorage.setItem('babyboo_derniere_commande', JSON.stringify({ orderId: data.orderId, total: data.total }))
      } catch {}

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
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="font-serif text-2xl sm:text-3xl text-baby-text mb-6 sm:mb-8">Finaliser la commande</h1>

      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
        <h2 className="font-serif text-lg sm:text-xl text-baby-text mb-3 sm:mb-4">Récapitulatif</h2>
        {cart.map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="flex justify-between py-2 border-b last:border-0">
            <div className="flex-1 min-w-0">
              <span>{item.name} x{item.quantity}</span>
              {item.customDescription && (
                <p className="text-xs text-baby-text/50 mt-0.5">{item.customDescription}</p>
              )}
            </div>
            <span className="font-semibold ml-4">
              {formatPrice(devis?.lignes[idx] ? devis.lignes[idx].total : item.price * item.quantity)}
            </span>
          </div>
        ))}
        {erreurDevis && (
          <div className="my-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {erreurDevis.ligne !== undefined && cart[erreurDevis.ligne] ? <strong>{cart[erreurDevis.ligne].name} : </strong> : null}
            {erreurDevis.message}
          </div>
        )}
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

      <form onSubmit={handleSubmit} className="relative bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6">
        <ChampPiege value={piege} onChange={setPiege} />
        <h2 className="font-serif text-lg sm:text-xl text-baby-text">Vos informations</h2>

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Nom complet *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            autoComplete="name"
            minLength={2}
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
            autoComplete="email"
            pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
            title="Entrez une adresse email valide (ex: nom@exemple.ch)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-baby-text mb-1">Téléphone *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9+\s()-]/g, '') })}
            className={inputClass}
            autoComplete="tel"
            inputMode="tel"
            pattern="[\+]?[0-9\s\-()]{7,}"
            title="Entrez un numéro de téléphone valide (ex: +41 79 123 45 67)"
            placeholder="+41 79 123 45 67"
          />
        </div>

        {/* Adresse de livraison — champs séparés */}
        {!isPickup && (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-baby-text">Adresse de livraison</h3>

            {/* Option to use saved address or different address */}
            {savedAddress && (
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-baby-beige/30 transition"
                  style={{ borderColor: useSavedAddress ? '#E8B4B8' : undefined }}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    checked={useSavedAddress}
                    onChange={() => {
                      setUseSavedAddress(true)
                      // Restore saved address fields
                      const parts = savedAddress.split(',').map(s => s.trim())
                      if (parts.length >= 3) {
                        const cityPart = parts[1]
                        const npaMatch = cityPart.match(/^(\d+)\s*(.*)$/)
                        setForm(prev => ({
                          ...prev,
                          street: parts[0],
                          npa: npaMatch ? npaMatch[1] : '',
                          city: npaMatch ? npaMatch[2] : cityPart,
                          canton: parts[2],
                        }))
                      }
                    }}
                    className="text-baby-rose"
                  />
                  <div>
                    <span className="text-sm font-medium">Mon adresse enregistrée</span>
                    <p className="text-xs text-baby-text/60">{savedAddress}</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-baby-beige/30 transition"
                  style={{ borderColor: !useSavedAddress ? '#E8B4B8' : undefined }}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    checked={!useSavedAddress}
                    onChange={() => {
                      setUseSavedAddress(false)
                      setForm(prev => ({ ...prev, street: '', npa: '', city: '', canton: '' }))
                    }}
                    className="text-baby-rose"
                  />
                  <div>
                    <span className="text-sm font-medium">Envoyer à une autre adresse</span>
                    <p className="text-xs text-baby-text/60">Idéal pour offrir un cadeau 🎁</p>
                  </div>
                </label>
              </div>
            )}
            {/* Show address fields when: no saved address, or chose "other address" */}
            {(!savedAddress || !useSavedAddress) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-baby-text mb-1">Rue et numéro *</label>
                  <input
                    type="text"
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: Rue de la Blancherie 35"
                    autoComplete="street-address"
                    minLength={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-baby-text mb-1">NPA *</label>
                    <input
                      type="text"
                      required
                      value={form.npa}
                      onChange={(e) => {
                        const npa = e.target.value.replace(/[^0-9]/g, '')
                        const update: Partial<typeof form> = { npa }
                        if (npa.length === 4) {
                          const entry = lookupNpa(npa)
                          if (entry) {
                            update.city = entry.city
                            update.canton = entry.canton
                          }
                        }
                        setForm(prev => ({ ...prev, ...update }))
                      }}
                      className={inputClass}
                      placeholder="1920"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      pattern="[0-9]{4}"
                      maxLength={4}
                      title="Entrez un NPA suisse à 4 chiffres"
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
                      autoComplete="address-level2"
                      minLength={2}
                      pattern="[A-Za-zÀ-ÿ\s\-'.]{2,}"
                      title="Entrez un nom de ville valide"
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
              </>
            )}
          </div>
        )}

        {/* Personnalisation — only show if items need it */}
        {allPersonalized ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">✅</span>
              <h3 className="font-serif text-lg text-baby-text">Personnalisation confirmée</h3>
            </div>
            <p className="text-sm text-baby-text/60">
              Vos articles ont déjà été personnalisés via le configurateur.
            </p>
            {cart.map((item, idx) => (
              item.customDescription && (
                <div key={`pers-${idx}`} className="mt-2 text-sm text-baby-text/70 bg-white/60 rounded-lg p-3">
                  <span className="font-medium">{item.name}</span> — {item.customDescription}
                </div>
              )
            ))}
            <div className="mt-3">
              <label className="block text-sm font-medium text-baby-text mb-1">Note supplémentaire (optionnel)</label>
              <textarea
                value={form.persNote}
                onChange={(e) => setForm({ ...form, persNote: e.target.value })}
                rows={2}
                className={inputClass}
                placeholder="Une remarque pour votre commande..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-baby-text">Personnalisation</h3>
            {somePersonalized && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-baby-text/70">
                <span className="font-medium">Certains articles sont déjà personnalisés.</span> Remplissez les champs ci-dessous pour les articles restants.
              </div>
            )}

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
        )}

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
          disabled={loading || !devis || !!erreurDevis}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? 'Traitement en cours...' : !devis && !erreurDevis ? 'Calcul du total…' : `Commander — ${formatPrice(total)}`}
        </button>
      </form>
    </div>
  )
}
