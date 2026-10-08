import { prisma } from './prisma'

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image: string
  images: string
  categories: string
  inStock: boolean
  featured: boolean
  isNew: boolean
}

// For backward compatibility with checkout (needs sync access by ID)
// These are DB-backed async functions
export async function getProductsFromDB() {
  return prisma.product.findMany({
    where: { inStock: true },
    orderBy: { name: 'asc' },
  })
}

export async function getAllProductsFromDB() {
  return prisma.product.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getFeaturedProductsFromDB() {
  return prisma.product.findMany({
    where: { featured: true, inStock: true },
    orderBy: { name: 'asc' },
  })
}

export async function getProductBySlugFromDB(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
  })
}

export async function getProductByIdFromDB(id: string) {
  return prisma.product.findUnique({
    where: { id },
  })
}
