import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Products are managed statically in src/lib/products.ts
  // Admin login is managed via ADMIN_EMAIL/ADMIN_PASSWORD env vars
  // This seed file is kept for future use if needed

  console.log('Database schema is ready. No seed data required.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
