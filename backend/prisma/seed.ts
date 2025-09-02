import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { email: 'kazimostofasakin34f@gmail.com' },
    update: {},
    create: {
      email: 'kazimostofasakin34f@gmail.com',
      name: 'Kazim Ostofa Sakin',
      isActive: true,
    },
  })
  
  console.log('Admin created:', admin)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })