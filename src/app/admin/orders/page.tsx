'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo } from 'react'
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
  paymentStatus: string
  shippingStatus: string
  paymentStatusAt: string | null
  shippingStatusAt: string | null
  statusHistory: { type: string; from: string; to: string; at: string }[]
  items: OrderItem[]
  savType: string | null
  savReason: string | null
  savNote: string | null
  savAt: string | null
  savLoss: number | null
  createdAt: string
  user?: { name: string; email: string } | null
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

type ViewMode = 'all' | 'to-produce' | 'to-ship' | 'shipped' | 'delivered' | 'unpaid' | 'sav'
type TimeRange = 'today' | 'week' | 'month' | 'all'

function parseAddress(address: string | null): { city: string; canton: string } | null {
  if (!address) return null
  // Format: "Rue ..., NPA Ville, Canton"
  const parts = address.split(',').map(s => s.trim())
  if (parts.length >= 3) {
    const cityPart = parts[1] // "NPA Ville"
    const canton = parts[2]
    const city = cityPart.replace(/^\d+\s*/, '') // Remove NPA
    return { city, canton }
  }
  if (parts.length === 2) {
    return { city: parts[0], canton: parts[1] }
  }
  return { city: address, canton: '' }
}

function isToday(date: Date): boolean {
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
  startOfWeek.setHours(0, 0, 0, 0)
  return date >= startOfWeek
}

function isThisMonth(date: Date): boolean {
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showLocationPanel, setShowLocationPanel] = useState(false)
  const [showProductPanel, setShowProductPanel] = useState(false)

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders')
    if (res.ok) {
      const data = await res.json()
      setAllOrders(data)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin')
    if (status === 'authenticated') fetchOrders()
  }, [status, router, fetchOrders])

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus }),
    })
    fetchOrders()
  }

  const updateShippingStatus = async (orderId: string, shippingStatus: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shippingStatus }),
    })
    fetchOrders()
  }

  // ─── Computed stats ───
  const stats = useMemo(() => {
    const now = new Date()
    const todayOrders = allOrders.filter(o => isToday(new Date(o.createdAt)))
    const weekOrders = allOrders.filter(o => isThisWeek(new Date(o.createdAt)))
    const monthOrders = allOrders.filter(o => isThisMonth(new Date(o.createdAt)))

    const unpaid = allOrders.filter(o => o.paymentStatus === 'UNPAID')
    const toProduce = allOrders.filter(o => o.paymentStatus === 'PAID' && o.shippingStatus === 'PROCESSING')
    const shipped = allOrders.filter(o => o.shippingStatus === 'SHIPPED')
    const delivered = allOrders.filter(o => o.shippingStatus === 'DELIVERED')

    const totalRevenue = allOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.total, 0)
    const monthRevenue = monthOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.total, 0)
    const weekRevenue = weekOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.total, 0)
    const todayRevenue = todayOrders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.total, 0)

    const savOrders = allOrders.filter(o => o.savType)
    const savRefunds = allOrders.filter(o => o.savType === 'refund')
    const savResends = allOrders.filter(o => o.savType === 'resend')
    const totalLoss = allOrders.reduce((sum, o) => sum + (o.savLoss || 0), 0)

    return {
      total: allOrders.length,
      today: todayOrders.length,
      week: weekOrders.length,
      month: monthOrders.length,
      unpaid: unpaid.length,
      toProduce: toProduce.length,
      shipped: shipped.length,
      delivered: delivered.length,
      totalRevenue,
      monthRevenue,
      weekRevenue,
      todayRevenue,
      savTotal: savOrders.length,
      savRefunds: savRefunds.length,
      savResends: savResends.length,
      totalLoss,
    }
  }, [allOrders])

  // ─── Location stats ───
  const locationStats = useMemo(() => {
    const cities: Record<string, number> = {}
    const cantons: Record<string, number> = {}

    allOrders.forEach(order => {
      const loc = parseAddress(order.address)
      if (loc) {
        if (loc.city) cities[loc.city] = (cities[loc.city] || 0) + 1
        if (loc.canton) cantons[loc.canton] = (cantons[loc.canton] || 0) + 1
      }
    })

    return {
      cities: Object.entries(cities).sort((a, b) => b[1] - a[1]),
      cantons: Object.entries(cantons).sort((a, b) => b[1] - a[1]),
    }
  }, [allOrders])

  // ─── Product stats ───
  const productStats = useMemo(() => {
    const products: Record<string, { name: string; quantity: number; revenue: number }> = {}

    allOrders.forEach(order => {
      ;(order.items as OrderItem[]).forEach(item => {
        const key = item.name
        if (!products[key]) {
          products[key] = { name: item.name, quantity: 0, revenue: 0 }
        }
        products[key].quantity += item.quantity
        products[key].revenue += item.price * item.quantity
      })
    })

    const sorted = Object.values(products).sort((a, b) => b.quantity - a.quantity)
    const totalQuantity = sorted.reduce((sum, p) => sum + p.quantity, 0)
    const totalRevenue = sorted.reduce((sum, p) => sum + p.revenue, 0)

    return { products: sorted, totalQuantity, totalRevenue }
  }, [allOrders])

  // ─── Filtered orders ───
  const filteredOrders = useMemo(() => {
    let filtered = [...allOrders]

    // View mode filter
    switch (viewMode) {
      case 'unpaid':
        filtered = filtered.filter(o => o.paymentStatus === 'UNPAID')
        break
      case 'to-produce':
        filtered = filtered.filter(o => o.paymentStatus === 'PAID' && o.shippingStatus === 'PROCESSING')
        break
      case 'to-ship':
        filtered = filtered.filter(o => o.paymentStatus === 'PAID' && o.shippingStatus === 'PROCESSING')
        break
      case 'shipped':
        filtered = filtered.filter(o => o.shippingStatus === 'SHIPPED')
        break
      case 'delivered':
        filtered = filtered.filter(o => o.shippingStatus === 'DELIVERED')
        break
      case 'sav':
        filtered = filtered.filter(o => !!o.savType)
        break
    }

    // Time range filter
    switch (timeRange) {
      case 'today':
        filtered = filtered.filter(o => isToday(new Date(o.createdAt)))
        break
      case 'week':
        filtered = filtered.filter(o => isThisWeek(new Date(o.createdAt)))
        break
      case 'month':
        filtered = filtered.filter(o => isThisMonth(new Date(o.createdAt)))
        break
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(o =>
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.orderId.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q) ||
        o.personalization?.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [allOrders, viewMode, timeRange, searchQuery])

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-baby-text/60">Chargement...</p>
      </div>
    )
  }

  const viewModeButtons: { id: ViewMode; label: string; count: number; icon: string; color: string }[] = [
    { id: 'all', label: 'Toutes', count: allOrders.length, icon: '📋', color: 'bg-gray-100 text-gray-700 border-gray-300' },
    { id: 'unpaid', label: 'Non payées', count: stats.unpaid, icon: '💰', color: 'bg-red-50 text-red-700 border-red-300' },
    { id: 'to-produce', label: 'À produire', count: stats.toProduce, icon: '🔨', color: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
    { id: 'shipped', label: 'Expédiées', count: stats.shipped, icon: '📦', color: 'bg-purple-50 text-purple-700 border-purple-300' },
    { id: 'delivered', label: 'Livrées', count: stats.delivered, icon: '✅', color: 'bg-green-50 text-green-700 border-green-300' },
    { id: 'sav', label: 'SAV', count: stats.savTotal, icon: '🔧', color: 'bg-orange-50 text-orange-700 border-orange-300' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-6">
            <h1 className="font-serif text-base sm:text-xl text-baby-text font-bold">Admin</h1>
            <nav className="flex gap-2 sm:gap-4">
              <Link href="/admin/products" className="text-xs sm:text-sm text-baby-text/60 hover:text-baby-text">
                Produits
              </Link>
              <Link href="/admin/orders" className="text-xs sm:text-sm text-baby-rose font-semibold">
                Commandes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/" className="text-xs sm:text-sm text-baby-text/60 hover:text-baby-text">
              Site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin' })}
              className="text-xs sm:text-sm text-red-500 hover:text-red-700"
            >
              Déco.
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* ═══ Revenue & Time Stats ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => setTimeRange('today')}
            className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm text-left transition hover:shadow-md border-2 ${timeRange === 'today' ? 'border-baby-rose' : 'border-transparent'}`}
          >
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Aujourd&apos;hui</p>
            <p className="text-lg sm:text-2xl font-bold text-baby-text mt-0.5 sm:mt-1">{stats.today} <span className="text-xs sm:text-sm font-normal text-gray-400">cmd</span></p>
            <p className="text-xs sm:text-sm font-semibold text-green-600 mt-0.5">{stats.todayRevenue.toFixed(0)} CHF</p>
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm text-left transition hover:shadow-md border-2 ${timeRange === 'week' ? 'border-baby-rose' : 'border-transparent'}`}
          >
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Semaine</p>
            <p className="text-lg sm:text-2xl font-bold text-baby-text mt-0.5 sm:mt-1">{stats.week} <span className="text-xs sm:text-sm font-normal text-gray-400">cmd</span></p>
            <p className="text-xs sm:text-sm font-semibold text-green-600 mt-0.5">{stats.weekRevenue.toFixed(0)} CHF</p>
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm text-left transition hover:shadow-md border-2 ${timeRange === 'month' ? 'border-baby-rose' : 'border-transparent'}`}
          >
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Ce mois</p>
            <p className="text-lg sm:text-2xl font-bold text-baby-text mt-0.5 sm:mt-1">{stats.month} <span className="text-xs sm:text-sm font-normal text-gray-400">cmd</span></p>
            <p className="text-xs sm:text-sm font-semibold text-green-600 mt-0.5">{stats.monthRevenue.toFixed(0)} CHF</p>
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm text-left transition hover:shadow-md border-2 ${timeRange === 'all' ? 'border-baby-rose' : 'border-transparent'}`}
          >
            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-lg sm:text-2xl font-bold text-baby-text mt-0.5 sm:mt-1">{stats.total} <span className="text-xs sm:text-sm font-normal text-gray-400">cmd</span></p>
            <p className="text-xs sm:text-sm font-semibold text-green-600 mt-0.5">{stats.totalRevenue.toFixed(0)} CHF</p>
          </button>
        </div>

        {/* ═══ SAV / Pertes summary ═══ */}
        {stats.savTotal > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6 border-l-4 border-orange-400">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <span className="text-lg">🔧</span>
              <span className="text-sm font-semibold text-gray-700">SAV</span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-6 sm:items-center mt-1 sm:mt-0">
              <div className="text-xs sm:text-sm">
                <span className="text-gray-500">Rembours. :</span>{' '}
                <span className="font-bold text-orange-600">{stats.savRefunds}</span>
              </div>
              <div className="text-xs sm:text-sm">
                <span className="text-gray-500">Renvois :</span>{' '}
                <span className="font-bold text-amber-600">{stats.savResends}</span>
              </div>
              <div className="text-xs sm:text-sm">
                <span className="text-gray-500">Pertes :</span>{' '}
                <span className="font-bold text-red-600">{stats.totalLoss.toFixed(2)} CHF</span>
              </div>
              <div className="text-xs sm:text-sm">
                <span className="text-gray-500">Net :</span>{' '}
                <span className="font-bold text-green-600">{(stats.totalRevenue - stats.totalLoss).toFixed(2)} CHF</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Status Filter Buttons ═══ */}
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 mb-4 sm:mb-6">
          <div className="flex gap-1.5 sm:gap-2 sm:flex-wrap min-w-max sm:min-w-0">
            {viewModeButtons.map(btn => (
              <button
                key={btn.id}
                onClick={() => setViewMode(viewMode === btn.id ? 'all' : btn.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition hover:shadow-sm whitespace-nowrap ${
                  viewMode === btn.id
                    ? `${btn.color} border-current shadow-sm`
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>{btn.icon}</span>
                <span className="hidden sm:inline">{btn.label}</span>
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                  viewMode === btn.id ? 'bg-white/50' : 'bg-gray-100'
                }`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats panels toggle */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => { setShowProductPanel(!showProductPanel); if (!showProductPanel) setShowLocationPanel(false) }}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition hover:shadow-sm ${
              showProductPanel
                ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span>📊</span>
            <span>Produits</span>
          </button>
          <button
            onClick={() => { setShowLocationPanel(!showLocationPanel); if (!showLocationPanel) setShowProductPanel(false) }}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 text-xs sm:text-sm font-medium transition hover:shadow-sm ${
              showLocationPanel
                ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span>📍</span>
            <span>Localités</span>
          </button>
        </div>

        {/* ═══ Location Panel ═══ */}
        {showLocationPanel && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="font-serif text-base sm:text-lg text-baby-text mb-3 sm:mb-4 flex items-center gap-2">
              <span>📍</span> Destinations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Cantons */}
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Par canton</h4>
                {locationStats.cantons.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune donnée</p>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2">
                    {locationStats.cantons.map(([canton, count]) => {
                      const pct = Math.round((count / allOrders.length) * 100)
                      return (
                        <div key={canton} className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm font-medium w-12 sm:w-16 text-baby-text truncate">{canton}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 sm:h-5 overflow-hidden">
                            <div
                              className="bg-baby-rose/60 h-full rounded-full transition-all"
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 w-16 sm:w-20 text-right">{count} ({pct}%)</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {/* Cities */}
              <div>
                <h4 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">Par ville</h4>
                {locationStats.cities.length === 0 ? (
                  <p className="text-sm text-gray-400">Aucune donnée</p>
                ) : (
                  <div className="space-y-1.5 sm:space-y-2">
                    {locationStats.cities.slice(0, 10).map(([city, count]) => {
                      const pct = Math.round((count / allOrders.length) * 100)
                      return (
                        <div key={city} className="flex items-center gap-2 sm:gap-3">
                          <span className="text-xs sm:text-sm font-medium w-20 sm:w-28 text-baby-text truncate">{city}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 sm:h-5 overflow-hidden">
                            <div
                              className="bg-blue-400/60 h-full rounded-full transition-all"
                              style={{ width: `${Math.max(pct, 5)}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-500 w-16 sm:w-20 text-right">{count} ({pct}%)</span>
                        </div>
                      )
                    })}
                    {locationStats.cities.length > 10 && (
                      <p className="text-xs text-gray-400">+{locationStats.cities.length - 10} autres villes</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Product Stats Panel ═══ */}
        {showProductPanel && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
            <h3 className="font-serif text-base sm:text-lg text-baby-text mb-3 sm:mb-4 flex items-center gap-2">
              <span>📊</span> Stats produits
            </h3>

            {productStats.products.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune donnée produit</p>
            ) : (
              <div>
                {/* Summary line */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-1 sm:gap-4 mb-4 sm:mb-5 p-2 sm:p-3 bg-gray-50 rounded-lg text-xs sm:text-sm">
                  <span className="text-gray-500">Vendus : <span className="font-bold text-baby-text">{productStats.totalQuantity} articles</span></span>
                  <span className="text-gray-500">CA : <span className="font-bold text-green-600">{productStats.totalRevenue.toFixed(2)} CHF</span></span>
                </div>

                {/* Mobile: card layout / Desktop: table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-gray-500 uppercase tracking-wide">
                        <th className="pb-2 pr-4">#</th>
                        <th className="pb-2 pr-4">Produit</th>
                        <th className="pb-2 pr-4 text-right">Qté</th>
                        <th className="pb-2 pr-4 text-right">Revenu</th>
                        <th className="pb-2 text-right">%</th>
                        <th className="pb-2 pl-4 w-40"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {productStats.products.map((p, i) => {
                        const pct = productStats.totalQuantity > 0 ? Math.round((p.quantity / productStats.totalQuantity) * 100) : 0
                        const isTop = i === 0
                        const isBottom = i === productStats.products.length - 1 && productStats.products.length > 1

                        return (
                          <tr key={p.name} className={`border-b last:border-0 ${isTop ? 'bg-green-50/50' : isBottom ? 'bg-red-50/30' : ''}`}>
                            <td className="py-3 pr-4">
                              {isTop ? (
                                <span className="text-lg" title="Best-seller">🏆</span>
                              ) : isBottom ? (
                                <span className="text-lg" title="Moins vendu">📉</span>
                              ) : (
                                <span className="text-gray-400 font-mono">{i + 1}</span>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`font-medium ${isTop ? 'text-green-700' : 'text-baby-text'}`}>{p.name}</span>
                              {isTop && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Best-seller</span>}
                              {isBottom && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Moins vendu</span>}
                            </td>
                            <td className="py-3 pr-4 text-right font-bold text-baby-text">{p.quantity}</td>
                            <td className="py-3 pr-4 text-right font-semibold text-green-600">{p.revenue.toFixed(2)} CHF</td>
                            <td className="py-3 text-right text-gray-500">{pct}%</td>
                            <td className="py-3 pl-4">
                              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${isTop ? 'bg-green-400' : isBottom ? 'bg-red-300' : 'bg-baby-rose/50'}`}
                                  style={{ width: `${Math.max(pct, 3)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile product cards */}
                <div className="sm:hidden space-y-2">
                  {productStats.products.map((p, i) => {
                    const pct = productStats.totalQuantity > 0 ? Math.round((p.quantity / productStats.totalQuantity) * 100) : 0
                    const isTop = i === 0
                    const isBottom = i === productStats.products.length - 1 && productStats.products.length > 1

                    return (
                      <div key={p.name} className={`p-3 rounded-lg border ${isTop ? 'bg-green-50/50 border-green-200' : isBottom ? 'bg-red-50/30 border-red-200' : 'bg-white border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">{isTop ? '🏆' : isBottom ? '📉' : `#${i + 1}`}</span>
                            <span className={`text-sm font-medium truncate ${isTop ? 'text-green-700' : 'text-baby-text'}`}>{p.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Qté: <span className="font-bold text-baby-text">{p.quantity}</span></span>
                          <span className="font-semibold text-green-600">{p.revenue.toFixed(2)} CHF</span>
                          <span className="text-gray-400">{pct}%</span>
                        </div>
                        <div className="mt-1.5 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isTop ? 'bg-green-400' : isBottom ? 'bg-red-300' : 'bg-baby-rose/50'}`}
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Search & Results Count ═══ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h2 className="text-xl font-serif text-baby-text">
              Commandes
              <span className="text-sm font-normal text-gray-400 ml-2">
                {filteredOrders.length}{filteredOrders.length !== allOrders.length ? ` / ${allOrders.length}` : ''}
              </span>
            </h2>
            {viewMode !== 'all' && (
              <p className="text-xs text-baby-rose mt-0.5">
                Filtre : {viewModeButtons.find(b => b.id === viewMode)?.label}
                {timeRange !== 'all' && ` · ${timeRange === 'today' ? "Aujourd'hui" : timeRange === 'week' ? 'Cette semaine' : 'Ce mois'}`}
              </p>
            )}
          </div>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher nom, email, commande..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50 focus:border-baby-rose"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ═══ Orders List ═══ */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500">
              {searchQuery ? 'Aucune commande trouvée pour cette recherche' : 'Aucune commande dans cette catégorie'}
            </p>
            {(viewMode !== 'all' || timeRange !== 'all' || searchQuery) && (
              <button
                onClick={() => { setViewMode('all'); setTimeRange('all'); setSearchQuery('') }}
                className="mt-3 text-sm text-baby-rose hover:underline"
              >
                Voir toutes les commandes
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const paymentInfo = paymentLabels[order.paymentStatus] || paymentLabels.UNPAID
              const shippingInfo = shippingLabels[order.shippingStatus] || shippingLabels.PROCESSING
              const isExpanded = expandedOrder === order.id
              const location = parseAddress(order.address)
              const isPickup = order.paymentMethod === 'cash'

              return (
                <div key={order.id} className={`bg-white rounded-xl shadow-sm overflow-hidden transition ${
                  order.paymentStatus === 'PAID' && order.shippingStatus === 'PROCESSING' ? 'ring-2 ring-yellow-300' : ''
                }`}>
                  <div
                    className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    {/* Mobile layout */}
                    <div className="sm:hidden">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-mono text-xs font-semibold text-baby-text">{order.orderId}</p>
                            {order.paymentStatus === 'PAID' && order.shippingStatus === 'PROCESSING' && (
                              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded font-medium">À FAIRE</span>
                            )}
                            {order.savType && (
                              <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${order.savType === 'refund' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                                {order.savType === 'refund' ? '💸' : '📦'} SAV
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-baby-text mt-0.5">{order.customerName}</p>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <p className="font-bold text-sm text-baby-text">{order.total.toFixed(2)} CHF</p>
                          <span className="text-gray-400 text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${paymentInfo.color}`}>
                          {paymentInfo.label}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${shippingInfo.color}`}>
                          {shippingInfo.label}
                        </span>
                        {isPickup && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1 py-0.5 rounded">🤝</span>
                        )}
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden sm:flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-sm font-semibold text-baby-text">{order.orderId}</p>
                            {order.paymentStatus === 'PAID' && order.shippingStatus === 'PROCESSING' && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">À FAIRE</span>
                            )}
                            {order.savType && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${order.savType === 'refund' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                                {order.savType === 'refund' ? '💸 SAV' : '📦 SAV'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            {' · '}
                            {new Date(order.createdAt).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-baby-text truncate">{order.customerName}</p>
                          <p className="text-xs text-gray-400 truncate">{order.customerEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end">
                        {location && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg hidden md:inline-flex items-center gap-1">
                            📍 {location.city}{location.canton ? ` (${location.canton})` : ''}
                          </span>
                        )}
                        {isPickup && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg hidden md:inline-flex items-center gap-1">
                            🤝 Retrait
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${paymentInfo.color}`}>
                          {paymentInfo.label}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${shippingInfo.color}`}>
                          {shippingInfo.label}
                        </span>
                        <p className="font-bold text-sm min-w-[70px] text-right">{order.total.toFixed(2)} CHF</p>
                        <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-5 border-t bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Client info */}
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">Client</h4>
                          <div className="space-y-1.5 text-sm">
                            <p className="font-medium text-baby-text">{order.customerName}</p>
                            <p className="text-gray-600">
                              <a href={`mailto:${order.customerEmail}`} className="hover:text-baby-rose">{order.customerEmail}</a>
                            </p>
                            <p className="text-gray-600">
                              <a href={`tel:${order.customerPhone}`} className="hover:text-baby-rose">{order.customerPhone}</a>
                            </p>
                            {order.user && (
                              <p className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">Compte client</p>
                            )}
                            <p className="text-gray-500 mt-2">
                              Paiement : <span className="font-medium capitalize">{order.paymentMethod}</span>
                            </p>
                          </div>
                        </div>

                        {/* Address & Personalization */}
                        <div>
                          {order.address ? (
                            <div className="mb-4">
                              <h4 className="font-semibold text-sm text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-1">
                                📍 Livraison
                              </h4>
                              <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border">{order.address}</p>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <h4 className="font-semibold text-sm text-gray-700 mb-2 uppercase tracking-wide">Retrait</h4>
                              <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">Retrait à Fully (VS)</p>
                            </div>
                          )}
                          {order.personalization && (
                            <div>
                              <h4 className="font-semibold text-sm text-gray-700 mb-2 uppercase tracking-wide">Personnalisation</h4>
                              <div className="bg-white rounded-lg border p-3 space-y-1.5">
                                {order.personalization.split('\n').map((line, i) => {
                                  const isLabel = /^(PRODUIT|PRÉNOM|MATÉRIAU|COULEURS|COMPOSITION|FORMES|NOTE|Prénom|Matériaux|Couleur|Note)\s*:/i.test(line)
                                  if (isLabel) {
                                    const [label, ...rest] = line.split(':')
                                    const value = rest.join(':').trim()
                                    return (
                                      <div key={i} className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label.trim()}</span>
                                        <span className={`text-sm font-medium ${
                                          label.trim().toUpperCase() === 'COMPOSITION' ? 'text-baby-rose font-mono text-xs bg-baby-beige/50 px-2 py-1 rounded mt-0.5' : 'text-gray-700'
                                        }`}>{value}</span>
                                      </div>
                                    )
                                  }
                                  if (line.includes('|')) {
                                    // Multiple products in coffret separated by |
                                    return (
                                      <div key={i} className="space-y-3">
                                        {line.split('|').map((part, j) => (
                                          <div key={j} className="bg-baby-beige/30 rounded-lg p-2">
                                            <div className="space-y-1">
                                              {part.trim().split('\n').map((subLine, k) => {
                                                const subLabel = /^(PRODUIT|PRÉNOM|MATÉRIAU|COULEURS|COMPOSITION|FORMES|NOTE)\s*:/i.test(subLine)
                                                if (subLabel) {
                                                  const [sl, ...sr] = subLine.split(':')
                                                  return (
                                                    <div key={k} className="flex flex-col">
                                                      <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{sl.trim()}</span>
                                                      <span className="text-sm font-medium text-gray-700">{sr.join(':').trim()}</span>
                                                    </div>
                                                  )
                                                }
                                                return <p key={k} className="text-sm text-gray-600">{subLine}</p>
                                              })}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )
                                  }
                                  return line.trim() ? <p key={i} className="text-sm text-gray-600">{line}</p> : null
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Articles */}
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">Articles</h4>
                          <div className="bg-white rounded-lg border p-3">
                            {(order.items as OrderItem[]).map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                                <span className="text-gray-700">{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                                <span className="font-medium">{(item.price * item.quantity).toFixed(2)} CHF</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs py-1 text-gray-400 mt-1">
                              <span>Livraison</span>
                              <span>{order.shipping > 0 ? `${order.shipping.toFixed(2)} CHF` : 'Gratuit'}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t mt-1 text-baby-text">
                              <span>Total</span>
                              <span>{order.total.toFixed(2)} CHF</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status controls */}
                      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">Paiement</label>
                          <select
                            value={order.paymentStatus}
                            onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                          >
                            <option value="UNPAID">Non payée</option>
                            <option value="PAID">Payée</option>
                            <option value="REFUNDED">Remboursée</option>
                          </select>
                          {order.paymentStatusAt && (
                            <span className="text-[10px] sm:text-xs text-gray-400 block sm:inline sm:ml-2 mt-0.5">
                              {new Date(order.paymentStatusAt).toLocaleDateString('fr-CH')} {new Date(order.paymentStatusAt).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div>
                          <label className="text-xs sm:text-sm font-medium text-gray-700 block mb-1">Livraison</label>
                          <select
                            value={order.shippingStatus}
                            onChange={(e) => updateShippingStatus(order.id, e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                          >
                            <option value="PROCESSING">En préparation</option>
                            <option value="SHIPPED">Expédiée</option>
                            <option value="DELIVERED">Livrée</option>
                          </select>
                          {order.shippingStatusAt && (
                            <span className="text-[10px] sm:text-xs text-gray-400 block sm:inline sm:ml-2 mt-0.5">
                              {new Date(order.shippingStatusAt).toLocaleDateString('fr-CH')} {new Date(order.shippingStatusAt).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* SAV Section */}
                      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2 sm:mb-3 flex items-center gap-2">
                          🔧 SAV <span className="hidden sm:inline">(garantie 30 jours)</span>
                        </h4>

                        {order.savType ? (
                          <div className={`p-3 sm:p-4 rounded-xl mb-3 ${order.savType === 'refund' ? 'bg-orange-50 border border-orange-200' : 'bg-amber-50 border border-amber-200'}`}>
                            <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                              <span className="text-lg sm:text-xl">{order.savType === 'refund' ? '💸' : '📦'}</span>
                              <div>
                                <p className="font-semibold text-xs sm:text-sm">{order.savType === 'refund' ? 'Remboursement' : 'Renvoi produit'}</p>
                                {order.savAt && (
                                  <p className="text-[10px] sm:text-xs text-gray-500">
                                    {new Date(order.savAt).toLocaleDateString('fr-CH')}
                                  </p>
                                )}
                              </div>
                              {order.savLoss !== null && order.savLoss > 0 && (
                                <span className="sm:ml-auto text-xs sm:text-sm font-bold text-red-600">Perte : {order.savLoss.toFixed(2)} CHF</span>
                              )}
                            </div>
                            {order.savReason && (
                              <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Raison :</span> {order.savReason}</p>
                            )}
                            {order.savNote && (
                              <p className="text-sm text-gray-600"><span className="font-medium">Note :</span> {order.savNote}</p>
                            )}
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Type SAV</label>
                            <select
                              value={order.savType || ''}
                              onChange={async (e) => {
                                const savType = e.target.value || null
                                const savLoss = savType === 'refund' ? order.total : savType === 'resend' ? (order.subtotal) : null
                                await fetch(`/api/orders/${order.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ savType, savLoss }),
                                })
                                fetchOrders()
                              }}
                              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                            >
                              <option value="">Aucun SAV</option>
                              <option value="refund">💸 Remboursement</option>
                              <option value="resend">📦 Renvoi du produit</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Perte (CHF)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={order.savLoss ?? ''}
                              onChange={async (e) => {
                                const val = e.target.value ? parseFloat(e.target.value) : null
                                await fetch(`/api/orders/${order.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ savLoss: val }),
                                })
                                fetchOrders()
                              }}
                              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Raison</label>
                            <input
                              type="text"
                              defaultValue={order.savReason || ''}
                              onBlur={async (e) => {
                                if (e.target.value !== (order.savReason || '')) {
                                  await fetch(`/api/orders/${order.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ savReason: e.target.value }),
                                  })
                                  fetchOrders()
                                }
                              }}
                              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                              placeholder="Ex: Perle cassée, clip défectueux..."
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Note admin</label>
                            <input
                              type="text"
                              defaultValue={order.savNote || ''}
                              onBlur={async (e) => {
                                if (e.target.value !== (order.savNote || '')) {
                                  await fetch(`/api/orders/${order.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ savNote: e.target.value }),
                                  })
                                  fetchOrders()
                                }
                              }}
                              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                              placeholder="Notes internes..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status history */}
                      {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <p className="text-xs font-medium text-gray-500 mb-2">Historique des changements :</p>
                          <div className="space-y-1">
                            {order.statusHistory.map((entry, idx) => {
                              const savLabels: Record<string, string> = { refund: 'Remboursement', resend: 'Renvoi produit', aucun: 'Aucun' }
                              const labels = entry.type === 'payment' ? paymentLabels : entry.type === 'sav' ? null : shippingLabels
                              const fromLabel = labels ? (labels[entry.from]?.label || entry.from) : (savLabels[entry.from] || entry.from)
                              const toLabel = labels ? (labels[entry.to]?.label || entry.to) : (savLabels[entry.to] || entry.to)
                              return (
                                <p key={idx} className="text-xs text-gray-500">
                                  {new Date(entry.at).toLocaleDateString('fr-CH')} {new Date(entry.at).toLocaleTimeString('fr-CH', { hour: '2-digit', minute: '2-digit' })}
                                  {' — '}
                                  <span className="font-medium">{entry.type === 'payment' ? 'Paiement' : entry.type === 'sav' ? 'SAV' : 'Livraison'}</span>
                                  {' : '}
                                  {fromLabel} → {toLabel}
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
