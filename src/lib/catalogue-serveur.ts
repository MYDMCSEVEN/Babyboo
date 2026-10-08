import { prisma } from '@/lib/prisma'
import { construireCatalogue, type Catalogue } from '@/lib/commande-calcul'

/** Produits de la base (prix de référence pour toute commande). */
export async function chargerCatalogue(): Promise<Catalogue> {
  const produits = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, price: true, inStock: true },
  })
  return construireCatalogue(produits)
}
