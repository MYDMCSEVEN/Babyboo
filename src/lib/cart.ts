import type { ConfigPanier } from './personnalisation'

export interface CartItem {
  id: string
  name: string
  price: number // affichage seulement : le serveur recalcule tout (08.10.2026)
  quantity: number
  image: string
  customDescription?: string
  config?: ConfigPanier // article du configurateur « Personnaliser »
  productId?: string // produit de la boutique quand `id` est un identifiant de ligne unique (« commander à nouveau »)
}

// Même plafond que le serveur (08.10.2026)
export const QUANTITE_MAX = 20

const CART_KEY = 'babyboo_cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const cart = localStorage.getItem(CART_KEY)
  return cart ? JSON.parse(cart) : []
}

export function addToCart(item: Omit<CartItem, 'quantity'>): CartItem[] {
  const cart = getCart()
  // Custom products are always unique (don't merge)
  if (item.customDescription) {
    cart.push({ ...item, quantity: 1 })
  } else {
    const existing = cart.find((i) => i.id === item.id)
    if (existing) {
      existing.quantity = Math.min(QUANTITE_MAX, existing.quantity + 1)
    } else {
      cart.push({ ...item, quantity: 1 })
    }
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
  return cart
}

export function removeFromCart(id: string): CartItem[] {
  let cart = getCart().filter((i) => i.id !== id)
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event('cart-updated'))
  return cart
}

export function updateQuantity(id: string, quantity: number): CartItem[] {
  const cart = getCart()
  const item = cart.find((i) => i.id === id)
  if (item) {
    item.quantity = Math.min(QUANTITE_MAX, Math.max(0, quantity))
  }
  const filtered = cart.filter((i) => i.quantity > 0)
  localStorage.setItem(CART_KEY, JSON.stringify(filtered))
  window.dispatchEvent(new Event('cart-updated'))
  return filtered
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event('cart-updated'))
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
}
