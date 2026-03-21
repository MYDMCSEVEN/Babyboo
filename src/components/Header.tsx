'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getCart } from '@/lib/cart'

export default function Header() {
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const update = () => {
      const cart = getCart()
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0))
    }
    update()
    window.addEventListener('cart-updated', update)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('cart-updated', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/images/logo-saumon.png" alt="Babyboo Créations" width={48} height={48} className="w-10 h-10 md:w-12 md:h-12" />
            <span className="font-serif text-lg sm:text-xl md:text-2xl text-baby-text font-bold">Babyboo Créations</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/boutique" className="text-baby-text hover:text-baby-brown transition">
              Boutique
            </Link>
            <Link href="/notre-histoire" className="text-baby-text hover:text-baby-brown transition">
              Notre Histoire
            </Link>
            <Link href="/contact" className="text-baby-text hover:text-baby-brown transition">
              Contact
            </Link>
            <Link href="/panier" className="relative text-baby-text hover:text-baby-brown transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-baby-rose text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Mobile: cart + menu button */}
          <div className="flex items-center space-x-4 md:hidden">
            <Link href="/panier" className="relative text-baby-text">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-baby-rose text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-baby-text">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="md:hidden pb-4 space-y-1 border-t border-baby-brown/10 pt-3">
            <Link href="/boutique" className="block py-3 px-2 text-baby-text hover:text-baby-brown hover:bg-baby-beige rounded-lg transition" onClick={() => setMenuOpen(false)}>
              Boutique
            </Link>
            <Link href="/notre-histoire" className="block py-3 px-2 text-baby-text hover:text-baby-brown hover:bg-baby-beige rounded-lg transition" onClick={() => setMenuOpen(false)}>
              Notre Histoire
            </Link>
            <Link href="/contact" className="block py-3 px-2 text-baby-text hover:text-baby-brown hover:bg-baby-beige rounded-lg transition" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
