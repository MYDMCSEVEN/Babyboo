'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getCart } from '@/lib/cart'

export default function Header() {
  const { data: session, status } = useSession()
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const isLoggedIn = status === 'authenticated'
  const userName = session?.user?.name || session?.user?.email || ''
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Image src="/images/logo-saumon.png" alt="Babyboo Créations" width={96} height={96} className="w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 flex-shrink-0" />
            <span className="font-serif text-base sm:text-lg md:text-2xl text-baby-text font-bold truncate">Babyboo Créations</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link href="/boutique" className="text-baby-text hover:text-baby-brown transition text-sm lg:text-base">
              Boutique
            </Link>
            <Link href="/personnaliser" className="text-baby-rose font-semibold hover:text-baby-rose/70 transition text-sm lg:text-base">
              Personnaliser ✨
            </Link>
            <Link href="/notre-histoire" className="text-baby-text hover:text-baby-brown transition text-sm lg:text-base">
              Notre Histoire
            </Link>
            <Link href="/contact" className="text-baby-text hover:text-baby-brown transition text-sm lg:text-base">
              Contact
            </Link>
            <Link href={isLoggedIn && session?.user?.role === 'ADMIN' ? '/admin/orders' : '/compte'} className="relative group">
              {isLoggedIn ? (
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    session?.user?.role === 'ADMIN' ? 'bg-baby-brown text-white' : 'bg-baby-rose text-white'
                  }`}>
                    {initials}
                  </div>
                  <span className="text-sm text-baby-text font-medium group-hover:text-baby-brown transition max-w-[100px] truncate">
                    {session?.user?.role === 'ADMIN' ? 'Admin' : (session?.user?.name?.split(' ')[0] || 'Compte')}
                  </span>
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-baby-text hover:text-baby-brown transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
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

          {/* Mobile: user + cart + menu button */}
          <div className="flex items-center gap-2 sm:gap-3 md:hidden">
            <Link href={isLoggedIn && session?.user?.role === 'ADMIN' ? '/admin/orders' : '/compte'} className="p-1.5">
              {isLoggedIn ? (
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                  session?.user?.role === 'ADMIN' ? 'bg-baby-brown text-white' : 'bg-baby-rose text-white'
                }`}>
                  {initials}
                </div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-baby-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </Link>
            <Link href="/panier" className="relative text-baby-text p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-baby-rose text-white text-[10px] rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-baby-text p-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav — slide down */}
        {menuOpen && (
          <nav className="md:hidden pb-4 space-y-1 border-t border-baby-brown/10 pt-3 animate-in slide-in-from-top-2">
            {isLoggedIn && (
              <div className="px-3 py-2 mb-1 bg-baby-beige/50 rounded-lg">
                <p className="text-sm text-baby-text font-medium truncate">Connecté : {session?.user?.name || session?.user?.email}</p>
              </div>
            )}
            <Link href="/boutique" className="flex items-center gap-3 py-3 px-3 text-baby-text hover:text-baby-brown hover:bg-baby-beige rounded-lg transition text-[15px]" onClick={() => setMenuOpen(false)}>
              <span className="text-lg">🛍</span> Boutique
            </Link>
            <Link href="/personnaliser" className="flex items-center gap-3 py-3 px-3 text-baby-rose font-semibold hover:bg-baby-beige rounded-lg transition text-[15px]" onClick={() => setMenuOpen(false)}>
              <span className="text-lg">✨</span> Personnaliser
            </Link>
            <Link href="/notre-histoire" className="flex items-center gap-3 py-3 px-3 text-baby-text hover:text-baby-brown hover:bg-baby-beige rounded-lg transition text-[15px]" onClick={() => setMenuOpen(false)}>
              <span className="text-lg">📖</span> Notre Histoire
            </Link>
            <Link href="/contact" className="flex items-center gap-3 py-3 px-3 text-baby-text hover:text-baby-brown hover:bg-baby-beige rounded-lg transition text-[15px]" onClick={() => setMenuOpen(false)}>
              <span className="text-lg">💌</span> Contact
            </Link>
            <Link
              href={isLoggedIn && session?.user?.role === 'ADMIN' ? '/admin/orders' : '/compte'}
              className="flex items-center gap-3 py-3 px-3 text-baby-text hover:text-baby-brown hover:bg-baby-beige rounded-lg transition text-[15px]"
              onClick={() => setMenuOpen(false)}
            >
              <span className="text-lg">👤</span>
              {isLoggedIn ? (session?.user?.role === 'ADMIN' ? 'Dashboard admin' : 'Mon compte') : 'Se connecter'}
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
