"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
async function main() {
    // Generate salt
    const salt = (0, crypto_1.randomBytes)(32).toString('hex'); // Use 32 bytes for better security
    // Hash password with Argon2id
    const password = 'Admin@123'; // default seed password
    const passwordHash = await argon2.hash(password + salt, {
        type: argon2.argon2id,
    });
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
    });
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
    });
    console.log('✅ Super Admin created successfully:', {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        password: password
    });
    console.log('\n⚠️  Security Notice:');
    console.log('- Please change the default password after first login');
    console.log('- Store the password securely');
    console.log('- Enable 2FA after login for enhanced security');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map