'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCart, removeFromCart, updateQuantity, CartItem } from '@/lib/cart'
import { formatPrice } from '@/lib/format'

export default function PanierPage() {
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    setCart(getCart())
    const update = () => setCart(getCart())
    window.addEventListener('cart-updated', update)
    return () => window.removeEventListener('cart-updated', update)
  }, [])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-6">🛒</div>
        <h1 className="font-serif text-3xl text-baby-text mb-4">Votre panier est vide</h1>
        <p className="text-baby-text/60 mb-8">Découvrez nos créations faites main</p>
        <Link href="/boutique" className="btn-primary">Voir la boutique</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-serif text-3xl text-baby-text mb-8">Votre Panier</h1>

      <div className="space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="relative w-20 h-20 bg-baby-beige rounded-lg overflow-hidden flex-shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-baby-text">{item.name}</h3>
              <p className="text-baby-brown font-bold">{formatPrice(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCart(updateQuantity(item.id, item.quantity - 1))}
                className="w-8 h-8 rounded-full bg-baby-beige text-baby-text flex items-center justify-center hover:bg-baby-pink transition"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <button
                onClick={() => setCart(updateQuantity(item.id, item.quantity + 1))}
                className="w-8 h-8 rounded-full bg-baby-beige text-baby-text flex items-center justify-center hover:bg-baby-pink transition"
              >
                +
              </button>
            </div>
            <p className="font-bold text-baby-text w-24 text-right">
              {formatPrice(item.price * item.quantity)}
            </p>
            <button
              onClick={() => setCart(removeFromCart(item.id))}
              className="text-red-400 hover:text-red-600 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center text-xl">
          <span className="font-serif text-baby-text">Total</span>
          <span className="font-bold text-baby-rose">{formatPrice(total)}</span>
        </div>
        <p className="text-sm text-baby-text/50 mt-2">Retrait en Suisse uniquement</p>
        <Link href="/checkout" className="btn-primary w-full block text-center mt-6">
          Passer la commande
        </Link>
      </div>
    </div>
  )
}
