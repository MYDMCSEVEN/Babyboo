'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
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
  user?: { name: string; email: string } | null
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Payée', color: 'bg-blue-100 text-blue-700' },
  SHIPPED: { label: 'Expédiée', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Livrée', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700' },
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')

  const fetchOrders = useCallback(async () => {
    const url = filterStatus ? `/api/orders?status=${filterStatus}` : '/api/orders'
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setOrders(data)
    }
  }, [filterStatus])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/admin')
    if (status === 'authenticated') fetchOrders()
  }, [status, router, fetchOrders])

  const updateStatus = async (orderId: string, newStatus: string) => {
    await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
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
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.total, 0)

  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="font-serif text-xl text-baby-text font-bold">Admin Babyboo</h1>
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

        {/* Filter + title */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif text-baby-text">Commandes</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-baby-rose/50"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="PAID">Payée</option>
            <option value="SHIPPED">Expédiée</option>
            <option value="DELIVERED">Livrée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <p className="text-gray-500">Aucune commande pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusLabels[order.status] || statusLabels.PENDING
              const isExpanded = expandedOrder === order.id

              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center space-x-6">
                      <div>
                        <p className="font-semibold text-baby-text">{order.orderId}</p>
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
                      <span className="text-gray-400">{isExpanded ? '\u25B2' : '\u25BC'}</span>
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
                          {order.user && (
                            <p className="text-xs text-blue-600 mt-1">Compte client</p>
                          )}
                          <p className="text-sm text-gray-600 mt-2">
                            Paiement : <span className="capitalize">{order.paymentMethod}</span>
                          </p>
                          {order.address && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Adresse :</p>
                              <p className="text-sm text-gray-600">{order.address}</p>
                            </div>
                          )}
                          {order.personalization && (
                            <div className="mt-2">
                              <p className="text-sm font-medium">Personnalisation :</p>
                              <p className="text-sm text-gray-600 whitespace-pre-line">{order.personalization}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Articles</h4>
                          {(order.items as OrderItem[]).map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-1">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{(item.price * item.quantity).toFixed(2)} CHF</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm py-1 text-gray-500">
                            <span>Sous-total</span>
                            <span>{order.subtotal.toFixed(2)} CHF</span>
                          </div>
                          <div className="flex justify-between text-sm py-1 text-gray-500">
                            <span>Livraison</span>
                            <span>{order.shipping > 0 ? `${order.shipping.toFixed(2)} CHF` : 'Gratuit'}</span>
                          </div>
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
                          <option value="PENDING">En attente</option>
                          <option value="PAID">Payée</option>
                          <option value="SHIPPED">Expédiée</option>
                          <option value="DELIVERED">Livrée</option>
                          <option value="CANCELLED">Annulée</option>
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
