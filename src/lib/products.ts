export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image: string
  images: string
  category: string
  inStock: boolean
  featured: boolean
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Attache-lolette',
    slug: 'attache-lolette',
    description: 'Attache-lolette fait main en bois et silicone, personnalisable avec le prénom de bébé. Sécuritaire et élégant, cet accessoire indispensable est fabriqué en Suisse avec amour.',
    price: 22,
    image: '/images/placeholder.svg',
    images: '[]',
    category: 'accessoires',
    inStock: true,
    featured: true,
  },
  {
    id: '2',
    name: 'Porte-clés personnalisé',
    slug: 'porte-cles',
    description: 'Porte-clés artisanal en perles de bois et silicone, personnalisable avec un prénom. Un cadeau unique fait main en Suisse.',
    price: 12,
    image: '/images/placeholder.svg',
    images: '[]',
    category: 'accessoires',
    inStock: true,
    featured: true,
  },
  {
    id: '3',
    name: 'Hochet de dentition',
    slug: 'hochet-dentition',
    description: 'Hochet de dentition en bois naturel et silicone alimentaire, sûr pour bébé. Fait main en Suisse, idéal pour soulager les gencives.',
    price: 12,
    image: '/images/placeholder.svg',
    images: '[]',
    category: 'jouets',
    inStock: true,
    featured: true,
  },
  {
    id: '4',
    name: 'Chaînette de poussette',
    slug: 'chainette-poussette',
    description: 'Chaînette décorative pour poussette en bois et silicone, personnalisable. Accessoire artisanal suisse pour embellir la poussette de bébé.',
    price: 28,
    image: '/images/placeholder.svg',
    images: '[]',
    category: 'accessoires',
    inStock: true,
    featured: true,
  },
  {
    id: '5',
    name: 'Coffret cadeau - Attache-lolette + Porte-clés',
    slug: 'coffret-lolette-porte-cles',
    description: 'Coffret cadeau comprenant une attache-lolette et un porte-clés assortis, personnalisables. Le cadeau de naissance parfait, fait main en Suisse.',
    price: 32,
    image: '/images/placeholder.svg',
    images: '[]',
    category: 'coffrets',
    inStock: true,
    featured: true,
  },
  {
    id: '6',
    name: 'Coffret cadeau - Attache-lolette + Hochet',
    slug: 'coffret-lolette-hochet',
    description: 'Coffret cadeau comprenant une attache-lolette et un hochet de dentition assortis, personnalisables. Idéal pour un cadeau de naissance unique.',
    price: 32,
    image: '/images/placeholder.svg',
    images: '[]',
    category: 'coffrets',
    inStock: true,
    featured: false,
  },
  {
    id: '7',
    name: 'Chaîne de téléphone',
    slug: 'chaine-telephone',
    description: 'Chaîne de téléphone en perles, accessoire tendance fait main en Suisse. Personnalisable avec un prénom ou un mot.',
    price: 19,
    image: '/images/placeholder.svg',
    images: '[]',
    category: 'accessoires',
    inStock: true,
    featured: false,
  },
  {
    id: '8',
    name: 'Porte-clés personnalisé double',
    slug: 'porte-cles-double',
    description: 'Porte-clés artisanal avec deux prénoms, parfait pour les parents ou les fratries. Fait main en Suisse avec des matériaux de qualité.',
    price: 19,
    image: '/images/placeholder.svg',
    images: '[]',
    category: 'accessoires',
    inStock: true,
    featured: false,
  },
]

export function getProducts() {
  return products.filter(p => p.inStock)
}

export function getFeaturedProducts() {
  return products.filter(p => p.featured && p.inStock)
}

export function getProductBySlug(slug: string) {
  return products.find(p => p.slug === slug)
}

export function getProductById(id: string) {
  return products.find(p => p.id === id)
}
