'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { name: string }
}

interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  total: number
  paymentMethod: string
  items: OrderItem[]
  createdAt: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700' },
  ready: { label: 'Prête', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    setOrders(data)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin')
    if (status === 'authenticated') fetchOrders()
  }, [status, router, fetchOrders])

  const updateStatus = async (orderId: string, newStatus: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchOrders()
  }

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-baby-text/60">Chargement...</p>
      </div>
    )
  }

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  const pendingOrders = orders.filter((o) => o.status === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="font-serif text-xl text-baby-text font-bold">🧸 Admin Babyboo</h1>
            <nav className="flex space-x-4">
              <Link href="/admin/products" className="text-baby-text/60 hover:text-baby-text">
                Produits
              </Link>
              <Link href="/admin/orders" className="text-baby-rose font-semibold">
                Commandes
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-sm text-baby-text/60 hover:text-baby-text">
              Voir le site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/admin' })}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total commandes</p>
            <p className="text-3xl font-bold text-baby-text">{orders.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingOrders}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <p className="text-sm text-gray-500">Revenu total</p>
            <p className="text-3xl font-bold text-green-600">{totalRevenue.toFixed(2)} CHF</p>
          </div>
        </div>

        <h2 className="text-2xl font-serif text-baby-text mb-6">Commandes</h2>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-500">Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusLabels[order.status] || statusLabels.pending
              const isExpanded = expandedOrder === order.id

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center space-x-6">
                      <div>
                        <p className="font-semibold text-baby-text">#{order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('fr-CH')}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-gray-500">{order.customerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="font-bold">{order.total.toFixed(2)} CHF</p>
                      <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 py-4 border-t bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-2">Client</h4>
                          <p>{order.customerName}</p>
                          <p className="text-sm text-gray-600">{order.customerEmail}</p>
                          <p className="text-sm text-gray-600">{order.customerPhone}</p>
                          <p className="text-sm text-gray-600 mt-2">
                            Paiement : <span className="capitalize">{order.paymentMethod}</span>
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Articles</h4>
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm py-1">
                              <span>{item.product.name} x{item.quantity}</span>
                              <span>{(item.price * item.quantity).toFixed(2)} CHF</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-bold pt-2 border-t mt-2">
                            <span>Total</span>
                            <span>{order.total.toFixed(2)} CHF</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center space-x-3">
                        <label className="text-sm font-medium">Statut :</label>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="ready">Prête</option>
                          <option value="delivered">Livrée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
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
  )
}
