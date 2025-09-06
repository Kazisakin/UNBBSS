const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const admin = await prisma.admin.create({
      data: {
        email: 'kazimostofasakin34f@gmail.com',
        name: 'System Administrator',
        isActive: true,
      }
    });
    
    console.log('Admin created:', admin);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();