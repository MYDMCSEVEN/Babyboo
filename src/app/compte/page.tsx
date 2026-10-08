'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PasswordInput from '@/components/PasswordInput'
import { addToCart } from '@/lib/cart'
import { lookupNpa } from '@/lib/npa-swiss'
import ChampPiege from '@/components/ChampPiege'
import { CHAMP_PIEGE } from '@/lib/champ-piege'
import type { ConfigPanier } from '@/lib/personnalisation'

interface OrderItem {
  name: string
  quantity: number
  price: number
  productId?: string // commandes passées depuis le 08.10.2026
  config?: ConfigPanier // article du configurateur (idem)
}

interface Order {
  id: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: string
  address: string | null
  personalization: string | null
  subtotal: number
  shipping: number
  total: number
  paymentStatus: string
  shippingStatus: string
  items: OrderItem[]
  createdAt: string
}

const paymentLabels: Record<string, { label: string; color: string }> = {
  UNPAID: { label: 'Non payée', color: 'bg-red-100 text-red-700' },
  PAID: { label: 'Payée', color: 'bg-green-100 text-green-700' },
  REFUNDED: { label: 'Remboursée', color: 'bg-orange-100 text-orange-700' },
}

const shippingLabels: Record<string, { label: string; color: string }> = {
  PROCESSING: { label: 'En préparation', color: 'bg-yellow-100 text-yellow-700' },
  SHIPPED: { label: 'Expédiée', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Livrée', color: 'bg-green-100 text-green-700' },
}

const inputClass = 'w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50'

export default function ComptePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [piege, setPiege] = useState('') // champ anti-robot (08.10.2026)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string; address: string | null; createdAt: string } | null>(null)
  const [editingAddress, setEditingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState({ street: '', npa: '', city: '', canton: '' })
  const [savingAddress, setSavingAddress] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  // Reorder
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  const [reorderNames, setReorderNames] = useState<string[]>([''])

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, [CHAMP_PIEGE]: piege }),
      })

      if (res.ok) {
        setForgotSent(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(res.status === 429 && data.error ? data.error : 'Erreur lors de l\'envoi. Réessayez.')
      }
    } catch {
      setError('Erreur lors de l\'envoi. Réessayez.')
    }

    setLoading(false)
  }

  useEffect(() => {
    if (status === 'authenticated') {
      // Si admin, rediriger vers le dashboard admin
      if (session?.user?.role === 'ADMIN') {
        router.push('/admin/orders')
        return
      }
      fetchOrders()
      fetchProfile()
    }
  }, [status, session, router])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Email ou mot de passe incorrect')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (regPassword !== regConfirm) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (regPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          phone: regPhone,
          password: regPassword,
          [CHAMP_PIEGE]: piege,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création du compte')
        setLoading(false)
        return
      }

      // Réponse volontairement identique si l'adresse est déjà utilisée (08.10.2026)
      setSuccess('Connexion en cours...')

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: regEmail,
        password: regPassword,
        redirect: false,
      })

      if (result?.error) {
        setSuccess('')
        setError('Si cette adresse n\'était pas encore utilisée, votre compte est créé : connectez-vous. Sinon, utilisez « Mot de passe oublié ».')
        setActiveTab('login')
      }
    } catch {
      setError('Erreur lors de la création du compte')
    }

    setLoading(false)
  }

  const parseAddressToForm = (address: string | null) => {
    if (!address) return { street: '', npa: '', city: '', canton: '' }
    const parts = address.split(',').map(s => s.trim())
    if (parts.length >= 3) {
      const cityPart = parts[1] // "NPA Ville"
      const npaMatch = cityPart.match(/^(\d+)\s*(.*)$/)
      return {
        street: parts[0],
        npa: npaMatch ? npaMatch[1] : '',
        city: npaMatch ? npaMatch[2] : cityPart,
        canton: parts[2],
      }
    }
    return { street: address, npa: '', city: '', canton: '' }
  }

  const handleSaveAddress = async () => {
    setSavingAddress(true)
    const address = `${addressForm.street}, ${addressForm.npa} ${addressForm.city}, ${addressForm.canton}`
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setEditingAddress(false)
      }
    } catch (err) {
      console.error('Error saving address:', err)
    }
    setSavingAddress(false)
  }

  // Count how many PRÉNOM lines exist in personalization (for coffrets with multiple items)
  const getNameCount = (order: Order): number => {
    if (!order.personalization) return 1
    const matches = order.personalization.match(/^PRÉNOM\s*:/gim)
      || order.personalization.match(/^Prénom\(s\)\s*:/gim)
    return matches ? matches.length : 1
  }

  const handleReorder = async (order: Order) => {
    const names = reorderNames.map(n => n.trim().toUpperCase()).filter(Boolean)
    if (names.length === 0) return

    // Anciennes commandes (avant le 08.10.2026) : pas d'identifiant produit enregistré,
    // on retrouve le produit de la boutique par son nom exact.
    let produitsParNom: Record<string, string> = {}
    if ((order.items as OrderItem[]).some(i => !i.productId && !i.config)) {
      try {
        const produits: { id: string; name: string }[] = await fetch('/api/products').then(r => r.json())
        produitsParNom = Object.fromEntries(produits.map(p => [p.name, p.id]))
      } catch {}
    }

    // Add each item to cart with updated personalization
    ;(order.items as OrderItem[]).forEach((item, itemIdx) => {
      let customDesc = ''
      if (order.personalization) {
        customDesc = order.personalization

        // Replace PRÉNOM lines one by one (for coffrets with multiple products)
        let nameIdx = 0
        customDesc = customDesc.replace(/^(PRÉNOM\s*:\s*).+$/gim, (match, prefix) => {
          const newName = names[nameIdx] || names[0]
          nameIdx++
          return `${prefix}${newName}`
        })
        // Also handle Prénom(s) format
        nameIdx = 0
        customDesc = customDesc.replace(/^(Prénom\(s\)\s*:\s*).+$/gim, (match, prefix) => {
          const newName = names[nameIdx] || names[0]
          nameIdx++
          return `${prefix}${newName}`
        })

        // Replace names in COMPOSITION lines too
        const oldNameMatches = order.personalization.match(/^PRÉNOM\s*:\s*(.+)$/gim)
          || order.personalization.match(/^Prénom\(s\)\s*:\s*(.+)$/gim)
        if (oldNameMatches) {
          oldNameMatches.forEach((line, i) => {
            const oldName = line.split(':')[1]?.trim()
            const newName = names[i] || names[0]
            if (oldName && customDesc.includes(`[${oldName}]`)) {
              customDesc = customDesc.replace(new RegExp(`\\[${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g'), `[${newName}]`)
            }
          })
        }
      }

      // Article du configurateur : on reprend sa configuration avec le(s) nouveau(x) prénom(s)
      if (item.config) {
        const config: ConfigPanier =
          item.config.kind === 'coffret'
            ? { ...item.config, items: item.config.items.map((c, i) => ({ ...c, name: names[i] || names[0] })) }
            : { ...item.config, name: names[0] }
        addToCart({
          id: `custom-${Date.now()}-${itemIdx}`,
          name: item.name,
          price: item.price,
          image: '/images/logo-saumon.png',
          customDescription: customDesc || undefined,
          config,
        })
        return
      }

      addToCart({
        // Identifiant de ligne unique ; le produit de la boutique est dans productId.
        // Introuvable (ancien article du configurateur) : la page de commande demandera de le recréer.
        id: `reorder-${item.name}-${Date.now()}-${itemIdx}`,
        productId: item.productId || produitsParNom[item.name],
        name: item.name,
        price: item.price,
        image: '/images/placeholder.jpg',
        customDescription: customDesc || undefined,
      })
    })

    setReorderingId(null)
    setReorderNames([''])
    router.push('/panier')
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baby-cream">
        <p className="text-baby-text/60">Chargement...</p>
      </div>
    )
  }

  // Not authenticated - show login/register forms
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-baby-cream py-8 sm:py-12">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-serif text-2xl sm:text-3xl text-baby-text text-center mb-6 sm:mb-8">Mon compte</h1>

          {/* Tabs */}
          <div className="flex mb-6 bg-white rounded-xl overflow-hidden shadow-sm">
            <button
              onClick={() => { setActiveTab('login'); setError(''); setSuccess('') }}
              className={`flex-1 py-3 text-center font-medium transition ${
                activeTab === 'login'
                  ? 'bg-baby-rose text-white'
                  : 'text-baby-text hover:bg-baby-beige'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); setSuccess('') }}
              className={`flex-1 py-3 text-center font-medium transition ${
                activeTab === 'register'
                  ? 'bg-baby-rose text-white'
                  : 'text-baby-text hover:bg-baby-beige'
              }`}
            >
              Créer un compte
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {success}
            </div>
          )}

          {activeTab === 'forgot' ? (
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              {forgotSent ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-4">📧</div>
                  <h3 className="font-serif text-xl text-baby-text mb-2">Email envoyé !</h3>
                  <p className="text-sm text-baby-text/60 mb-4">
                    Si un compte existe avec l&apos;adresse <strong>{forgotEmail}</strong>, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.
                  </p>
                  <p className="text-xs text-baby-text/40 mb-4">Vérifiez aussi vos spams.</p>
                  <button
                    onClick={() => { setActiveTab('login'); setForgotSent(false); setForgotEmail(''); setError('') }}
                    className="text-baby-rose font-medium hover:underline text-sm"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="relative space-y-4">
                  <ChampPiege value={piege} onChange={setPiege} />
                  <p className="text-sm text-baby-text/70">
                    Entrez votre adresse email. Vous recevrez un lien pour créer un nouveau mot de passe.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-baby-text mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className={inputClass}
                      placeholder="votre@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setError('') }}
                    className="w-full text-center text-sm text-baby-text/50 hover:text-baby-text"
                  >
                    Retour à la connexion
                  </button>
                </form>
              )}
            </div>
          ) : activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className={inputClass}
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Mot de passe</label>
                <PasswordInput
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setActiveTab('forgot'); setError(''); setSuccess('') }}
                  className="text-sm text-baby-rose hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="relative bg-white rounded-xl p-6 shadow-sm space-y-4">
              <ChampPiege value={piege} onChange={setPiege} />
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={inputClass}
                  placeholder="Marie Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className={inputClass}
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/[^0-9+\s()-]/g, ''))}
                  className={inputClass}
                  placeholder="+41 79 123 45 67"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Mot de passe *</label>
                <PasswordInput
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="6 caractères minimum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Confirmer le mot de passe *</label>
                <PasswordInput
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer mon compte'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Authenticated - show dashboard with orders
  return (
    <div className="min-h-screen bg-baby-cream py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start sm:items-center mb-6 sm:mb-8 gap-3">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl text-baby-text">Mon compte</h1>
            <p className="text-baby-text/60 mt-1 text-sm sm:text-base truncate">Bienvenue, {session?.user?.name || session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-secondary text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-3 flex-shrink-0"
          >
            Déconnexion
          </button>
        </div>

        {/* Profile info */}
        {profile && (
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <h2 className="font-serif text-xl text-baby-text mb-4">Mes informations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-baby-text/50 mb-1">Nom</p>
                <p className="text-baby-text font-medium">{profile.name}</p>
              </div>
              <div>
                <p className="text-baby-text/50 mb-1">Email</p>
                <p className="text-baby-text font-medium">{profile.email}</p>
              </div>
              <div>
                <p className="text-baby-text/50 mb-1">Téléphone</p>
                <p className="text-baby-text font-medium">{profile.phone || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-baby-text/50 mb-1">Membre depuis</p>
                <p className="text-baby-text font-medium">
                  {new Date(profile.createdAt).toLocaleDateString('fr-CH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Address section */}
            <div className="mt-5 pt-5 border-t border-baby-brown/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg text-baby-text flex items-center gap-2">
                  📍 Adresse de livraison
                </h3>
                {!editingAddress && (
                  <button
                    onClick={() => {
                      setAddressForm(parseAddressToForm(profile.address))
                      setEditingAddress(true)
                    }}
                    className="text-sm text-baby-rose hover:underline font-medium"
                  >
                    {profile.address ? 'Modifier' : '+ Ajouter'}
                  </button>
                )}
              </div>

              {editingAddress ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-baby-text/60 mb-1">Rue et numéro</label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      className={inputClass}
                      placeholder="Ex: Rue de la Blancherie 35"
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-baby-text/60 mb-1">NPA</label>
                      <input
                        type="text"
                        value={addressForm.npa}
                        onChange={(e) => {
                          const npa = e.target.value.replace(/[^0-9]/g, '')
                          const update: Partial<typeof addressForm> = { npa }
                          if (npa.length === 4) {
                            const entry = lookupNpa(npa)
                            if (entry) {
                              update.city = entry.city
                              update.canton = entry.canton
                            }
                          }
                          setAddressForm(prev => ({ ...prev, ...update }))
                        }}
                        className={inputClass}
                        placeholder="1920"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        maxLength={4}
                        pattern="[0-9]{4}"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-baby-text/60 mb-1">Ville</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className={inputClass}
                        placeholder="Martigny"
                        autoComplete="address-level2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-baby-text/60 mb-1">Canton</label>
                    <select
                      value={addressForm.canton}
                      onChange={(e) => setAddressForm({ ...addressForm, canton: e.target.value })}
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
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveAddress}
                      disabled={savingAddress || !addressForm.street || !addressForm.npa || !addressForm.city || !addressForm.canton}
                      className="px-5 py-2.5 bg-baby-rose text-white rounded-lg text-sm font-medium hover:bg-baby-rose/90 transition disabled:opacity-40"
                    >
                      {savingAddress ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => setEditingAddress(false)}
                      className="px-4 py-2.5 text-baby-text/50 hover:text-baby-text text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : profile.address ? (
                <div className="bg-baby-beige/30 rounded-lg p-3">
                  <p className="text-sm text-baby-text">{profile.address}</p>
                  <p className="text-xs text-baby-text/50 mt-1">Cette adresse sera pré-remplie lors de vos prochaines commandes.</p>
                </div>
              ) : (
                <p className="text-sm text-baby-text/50">
                  Ajoutez votre adresse pour ne plus avoir à la saisir à chaque commande.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Orders */}
        <div>
          <h2 className="font-serif text-2xl text-baby-text mb-6">Mes commandes</h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm">
              <p className="text-baby-text/60 mb-4">Vous n&apos;avez pas encore de commandes</p>
              <Link href="/boutique" className="btn-primary inline-block">
                Découvrir nos créations
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const paymentInfo = paymentLabels[order.paymentStatus] || paymentLabels.UNPAID
                const shippingInfo = shippingLabels[order.shippingStatus] || shippingLabels.PROCESSING
                const isExpanded = expandedOrder === order.id

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div
                      className="px-4 sm:px-6 py-3 sm:py-4 cursor-pointer hover:bg-baby-beige/30 transition"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      {/* Mobile layout */}
                      <div className="sm:hidden">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-baby-text text-sm">{order.orderId}</p>
                            <p className="text-xs text-baby-text/60">
                              {new Date(order.createdAt).toLocaleDateString('fr-CH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-baby-text text-sm">{order.total.toFixed(2)} CHF</p>
                            <span className="text-baby-text/40 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${paymentInfo.color}`}>
                            {paymentInfo.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${shippingInfo.color}`}>
                            {shippingInfo.label}
                          </span>
                        </div>
                      </div>
                      {/* Desktop layout */}
                      <div className="hidden sm:flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-baby-text">{order.orderId}</p>
                          <p className="text-sm text-baby-text/60">
                            {new Date(order.createdAt).toLocaleDateString('fr-CH', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${paymentInfo.color}`}>
                            {paymentInfo.label}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${shippingInfo.color}`}>
                            {shippingInfo.label}
                          </span>
                          <p className="font-bold text-baby-text">{order.total.toFixed(2)} CHF</p>
                          <span className="text-baby-text/40">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-baby-brown/10 bg-baby-beige/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <h4 className="font-semibold text-baby-text mb-2">Articles</h4>
                            {(order.items as OrderItem[]).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm py-1">
                                <span className="text-baby-text">{item.name} x{item.quantity}</span>
                                <span className="text-baby-text/70">{(item.price * item.quantity).toFixed(2)} CHF</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-sm py-1 text-baby-text/60">
                              <span>Livraison</span>
                              <span>{order.shipping > 0 ? `${order.shipping.toFixed(2)} CHF` : 'Gratuit'}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t border-baby-brown/10 mt-2 text-baby-text">
                              <span>Total</span>
                              <span>{order.total.toFixed(2)} CHF</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-baby-text mb-1">Paiement</h4>
                              <p className="text-sm text-baby-text/70 capitalize">{order.paymentMethod}</p>
                            </div>
                            {order.address && (
                              <div>
                                <h4 className="font-semibold text-baby-text mb-1">Adresse</h4>
                                <p className="text-sm text-baby-text/70">{order.address}</p>
                              </div>
                            )}
                            {order.personalization && (
                              <div>
                                <h4 className="font-semibold text-baby-text mb-1">Personnalisation</h4>
                                <p className="text-sm text-baby-text/70 whitespace-pre-line">{order.personalization}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Reorder section */}
                        <div className="mt-4 pt-4 border-t border-baby-brown/10">
                          {reorderingId === order.id ? (
                            <div className="bg-baby-beige/50 rounded-xl p-4">
                              <p className="text-sm font-medium text-baby-text mb-2">
                                🔄 Recommander avec un autre prénom
                              </p>
                              <p className="text-xs text-baby-text/60 mb-3">
                                Les mêmes articles seront ajoutés au panier avec le(s) nouveau(x) prénom(s).
                              </p>
                              <div className="space-y-2 mb-3">
                                {reorderNames.map((name, idx) => (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <span className="text-xs text-baby-text/50 w-20 shrink-0">
                                      {reorderNames.length > 1 ? `Prénom ${idx + 1}` : 'Prénom'}
                                    </span>
                                    <input
                                      type="text"
                                      value={name}
                                      onChange={(e) => {
                                        const updated = [...reorderNames]
                                        updated[idx] = e.target.value
                                        setReorderNames(updated)
                                      }}
                                      placeholder={`Ex: ${idx === 0 ? 'Lucas' : 'Emma'}`}
                                      className="flex-1 px-4 py-2.5 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50 text-sm"
                                      autoFocus={idx === 0}
                                      onKeyDown={(e) => e.key === 'Enter' && handleReorder(order)}
                                    />
                                    {reorderNames.length > 1 && (
                                      <button
                                        onClick={() => setReorderNames(reorderNames.filter((_, i) => i !== idx))}
                                        className="text-red-400 hover:text-red-600 text-xs px-1"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {getNameCount(order) > 1 && reorderNames.length < getNameCount(order) && (
                                <button
                                  onClick={() => setReorderNames([...reorderNames, ''])}
                                  className="text-xs text-baby-rose hover:underline mb-3"
                                >
                                  + Ajouter un prénom (coffret)
                                </button>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReorder(order)}
                                  disabled={!reorderNames.some(n => n.trim())}
                                  className="px-5 py-2.5 bg-baby-rose text-white rounded-lg text-sm font-medium hover:bg-baby-rose/90 transition disabled:opacity-40"
                                >
                                  🛒 Ajouter au panier
                                </button>
                                <button
                                  onClick={() => { setReorderingId(null); setReorderNames(['']) }}
                                  className="px-3 py-2.5 text-baby-text/50 hover:text-baby-text text-sm"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReorderingId(order.id)
                                const count = getNameCount(order)
                                setReorderNames(Array(count).fill(''))
                              }}
                              className="flex items-center gap-2 px-4 py-2.5 bg-baby-rose/10 text-baby-rose rounded-lg text-sm font-medium hover:bg-baby-rose/20 transition"
                            >
                              🔄 Recommander avec un autre prénom
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
