import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  // Generate salt
  const salt = randomBytes(32).toString('hex') // Use 32 bytes for better security
  
  // Hash password with Argon2id
  const password = 'Admin@123' // default seed password
  const passwordHash = await argon2.hash(password + salt, {
    type: argon2.argon2id,
  })

  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { email: 'kazimostofasakin34f@gmail.com' },
    update: {}, // Don't update if exists
    create: {
      email: 'kazimostofasakin34f@gmail.com',
      name: 'Kazim Mostofa Sakin',
      role: 'SUPER_ADMIN', // Changed from 'userRole' to 'role'
      passwordHash,
      salt,
      isActive: true,
      isVerified: true,
      mustChangePassword: false, // Set to true for production
      activatedAt: new Date(),
    },
  })

  // Create initial system activity log
  await prisma.systemActivity.create({
    data: {
      activityType: 'ADMIN_ACTIVATED',
      category: 'ADMIN_MANAGEMENT',
      severity: 'INFO',
      actorType: 'SYSTEM',
      targetType: 'Admin',
      targetId: admin.id,
      targetEmail: admin.email,
      ipAddress: '127.0.0.1',
      description: `Super Admin account created for ${admin.email} during system setup`,
      success: true,
      metadata: {
        seedVersion: '1.0',
        createdAt: new Date().toISOString()
      }
    }
  })

  console.log('✅ Super Admin created successfully:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    password: password
  })
  
  console.log('\n⚠️  Security Notice:')
  console.log('- Please change the default password after first login')
  console.log('- Store the password securely')
  console.log('- Enable 2FA after login for enhanced security')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })