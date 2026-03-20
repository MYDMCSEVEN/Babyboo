import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  await prisma.admin.upsert({
    where: { email: 'admin@babyboo.ch' },
    update: {},
    create: {
      email: 'admin@babyboo.ch',
      password: hashSync('changeme', 10),
    },
  })

  // Seed products
  const products = [
    {
      name: 'Attache-lolette',
      slug: 'attache-lolette',
      description: 'Attache-lolette fait main en bois et silicone, personnalisable avec le prénom de bébé. Sécuritaire et élégant, cet accessoire indispensable est fabriqué en Suisse avec amour.',
      price: 22,
      category: 'accessoires',
      featured: true,
      image: '/images/placeholder.jpg',
    },
    {
      name: 'Porte-clés personnalisé',
      slug: 'porte-cles',
      description: 'Porte-clés artisanal en perles de bois et silicone, personnalisable avec un prénom. Un cadeau unique fait main en Suisse.',
      price: 12,
      category: 'accessoires',
      featured: true,
      image: '/images/placeholder.jpg',
    },
    {
      name: 'Hochet de dentition',
      slug: 'hochet-dentition',
      description: 'Hochet de dentition en bois naturel et silicone alimentaire, sûr pour bébé. Fait main en Suisse, idéal pour soulager les gencives.',
      price: 12,
      category: 'jouets',
      featured: true,
      image: '/images/placeholder.jpg',
    },
    {
      name: 'Chaînette de poussette',
      slug: 'chainette-poussette',
      description: 'Chaînette décorative pour poussette en bois et silicone, personnalisable. Accessoire artisanal suisse pour embellir la poussette de bébé.',
      price: 28,
      category: 'accessoires',
      featured: true,
      image: '/images/placeholder.jpg',
    },
    {
      name: 'Coffret cadeau - Attache-lolette + Porte-clés',
      slug: 'coffret-lolette-porte-cles',
      description: 'Coffret cadeau comprenant une attache-lolette et un porte-clés assortis, personnalisables. Le cadeau de naissance parfait, fait main en Suisse.',
      price: 32,
      category: 'coffrets',
      featured: true,
      image: '/images/placeholder.jpg',
    },
    {
      name: 'Coffret cadeau - Attache-lolette + Hochet',
      slug: 'coffret-lolette-hochet',
      description: 'Coffret cadeau comprenant une attache-lolette et un hochet de dentition assortis, personnalisables. Idéal pour un cadeau de naissance unique.',
      price: 32,
      category: 'coffrets',
      featured: false,
      image: '/images/placeholder.jpg',
    },
    {
      name: 'Chaîne de téléphone',
      slug: 'chaine-telephone',
      description: 'Chaîne de téléphone en perles, accessoire tendance fait main en Suisse. Personnalisable avec un prénom ou un mot.',
      price: 19,
      category: 'accessoires',
      featured: false,
      image: '/images/placeholder.jpg',
    },
    {
      name: 'Porte-clés personnalisé double',
      slug: 'porte-cles-double',
      description: 'Porte-clés artisanal avec deux prénoms, parfait pour les parents ou les fratries. Fait main en Suisse avec des matériaux de qualité.',
      price: 19,
      category: 'accessoires',
      featured: false,
      image: '/images/placeholder.jpg',
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
