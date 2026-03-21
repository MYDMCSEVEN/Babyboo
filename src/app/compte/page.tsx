'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface OrderItem {
  name: string
  quantity: number
  price: number
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
  status: string
  items: OrderItem[]
  createdAt: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Payée', color: 'bg-blue-100 text-blue-700' },
  SHIPPED: { label: 'Expédiée', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Livrée', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
}

const inputClass = 'w-full px-4 py-3 rounded-lg border border-baby-brown/20 focus:outline-none focus:ring-2 focus:ring-baby-rose/50'

export default function ComptePage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders()
    }
  }, [status])

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
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création du compte')
        setLoading(false)
        return
      }

      setSuccess('Compte créé avec succès ! Connexion en cours...')

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: regEmail,
        password: regPassword,
        redirect: false,
      })

      if (result?.error) {
        setError('Compte créé mais erreur de connexion. Veuillez vous connecter.')
        setActiveTab('login')
      }
    } catch {
      setError('Erreur lors de la création du compte')
    }

    setLoading(false)
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
      <div className="min-h-screen bg-baby-cream py-12">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-serif text-3xl text-baby-text text-center mb-8">Mon compte</h1>

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

          {activeTab === 'login' ? (
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
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
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
                  onChange={(e) => setRegPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+41 79 123 45 67"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Mot de passe *</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className={inputClass}
                  placeholder="6 caractères minimum"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-baby-text mb-1">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className={inputClass}
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
    <div className="min-h-screen bg-baby-cream py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-3xl text-baby-text">Mon compte</h1>
            <p className="text-baby-text/60 mt-1">Bienvenue, {session?.user?.name || session?.user?.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-secondary text-sm"
          >
            Déconnexion
          </button>
        </div>

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
                const statusInfo = statusLabels[order.status] || statusLabels.PENDING
                const isExpanded = expandedOrder === order.id

                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div
                      className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-baby-beige/30"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-center space-x-6">
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
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <p className="font-bold text-baby-text">{order.total.toFixed(2)} CHF</p>
                        <span className="text-baby-text/40">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 py-4 border-t border-baby-brown/10 bg-baby-beige/20">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
