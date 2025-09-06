import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
    sessionId: string;
  };
}

const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  
  return (
    (typeof forwarded === 'string' ? forwarded.split(',')[0] : null) ||
    (typeof realIP === 'string' ? realIP : null) ||
    (typeof cfConnectingIP === 'string' ? cfConnectingIP : null) ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  ).trim();
};

// Simplified logging that uses only valid enum values from your schema
const logSystemActivity = async (data: {
  activityType: string;
  category: string;
  severity?: string;
  actorType: string;
  actorId?: string;
  actorEmail?: string;
  ipAddress: string;
  userAgent?: string;
  description: string;
  success: boolean;
  metadata?: any;
}) => {
  try {
    // Map to valid enum values from your Prisma schema
    const validActivityTypes: Record<string, string> = {
      'ADMIN_SESSION_VALIDATED': 'ADMIN_LOGIN',
      'UNAUTHORIZED_ACCESS_ATTEMPT': 'UNAUTHORIZED_ACCESS_ATTEMPT', 
      'SYSTEM_ERROR': 'SYSTEM_ERROR',
      'ADMIN_LOGIN': 'ADMIN_LOGIN',
      'ADMIN_LOGOUT': 'ADMIN_LOGOUT'
    };

    const mappedActivityType = validActivityTypes[data.activityType] || 'ADMIN_LOGIN';
    
    await prisma.systemActivity.create({
      data: {
        activityType: mappedActivityType as any,
        category: data.category as any,
        severity: (data.severity || 'INFO') as any,
        actorType: data.actorType as any,
        actorId: data.actorId || null,
        actorEmail: data.actorEmail || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent || null,
        description: data.description,
        success: data.success,
        metadata: data.metadata || null,
      }
    });
  } catch (error) {
    console.error('Failed to log system activity:', error);
    // Don't throw - just log and continue
  }
};

const logSecurityEvent = async (data: {
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  adminId?: string;
  ipAddress: string;
  userAgent?: string;
  description: string;
  metadata?: any;
}) => {
  try {
    await prisma.securityEvent.create({
      data: {
        eventType: data.eventType as any,
        severity: data.severity as any,
        adminId: data.adminId || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent || null,
        description: data.description,
        metadata: data.metadata || null,
      }
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Rate limiting
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    error: 'Too many authentication attempts from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      const ip = getClientIP(req);
      return ip === '127.0.0.1' || ip === '::1';
    }
    return false;
  },
  handler: async (req, res) => {
    const clientIP = getClientIP(req);
    const userAgent = req.get('User-Agent');
    
    await logSecurityEvent({
      eventType: 'MULTIPLE_FAILED_LOGINS',
      severity: 'HIGH',
      ipAddress: clientIP,
      userAgent: userAgent || '',
      description: `Rate limit exceeded for IP: ${clientIP}`,
      metadata: {
        endpoint: req.originalUrl,
        method: req.method,
      }
    });
    
    res.status(429).json({
      error: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Main authentication middleware
export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const clientIP = getClientIP(req);
  const userAgent = req.get('User-Agent') || '';
  const authHeader = req.headers.authorization;
  
  try {
    // Check for authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await logSystemActivity({
        activityType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        category: 'SECURITY',
        severity: 'WARNING',
        actorType: 'ANONYMOUS',
        ipAddress: clientIP,
        userAgent,
        description: 'Missing or invalid authorization header',
        success: false,
        metadata: {
          endpoint: req.originalUrl,
          method: req.method,
        }
      });
      
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'MISSING_TOKEN' 
      });
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (jwtError) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'MEDIUM',
        ipAddress: clientIP,
        userAgent,
        description: `Invalid JWT token: ${jwtError}`,
        metadata: {
          endpoint: req.originalUrl,
          method: req.method,
        }
      });
      
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN' 
      });
    }
    
    // Check session in database
    const session = await prisma.adminSession.findFirst({
      where: {
        sessionToken: token,
        adminId: decoded.id,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            isLocked: true,
            lockedUntil: true,
            failedAttempts: true,
          }
        }
      }
    });
    
    if (!session) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'HIGH',
        adminId: decoded.id,
        ipAddress: clientIP,
        userAgent,
        description: 'Session not found or expired',
        metadata: {
          decodedAdminId: decoded.id,
          sessionId: decoded.sessionId,
          endpoint: req.originalUrl,
        }
      });
      
      return res.status(401).json({ 
        error: 'Session expired or invalid',
        code: 'SESSION_EXPIRED' 
      });
    }
    
    const admin = session.admin;
    
    // Check admin account status
    if (!admin.isActive) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'HIGH',
        adminId: admin.id,
        ipAddress: clientIP,
        userAgent,
        description: 'Inactive admin account attempted access',
        metadata: {
          adminEmail: admin.email,
          endpoint: req.originalUrl,
        }
      });
      
      return res.status(403).json({ 
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE' 
      });
    }
    
    if (!admin.isVerified) {
      return res.status(403).json({ 
        error: 'Account is not verified',
        code: 'ACCOUNT_UNVERIFIED' 
      });
    }
    
    if (admin.isLocked || (admin.lockedUntil && new Date() < admin.lockedUntil)) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        severity: 'HIGH',
        adminId: admin.id,
        ipAddress: clientIP,
        userAgent,
        description: 'Locked admin account attempted access',
        metadata: {
          adminEmail: admin.email,
          lockedUntil: admin.lockedUntil,
          failedAttempts: admin.failedAttempts,
        }
      });
      
      return res.status(423).json({ 
        error: 'Account is locked',
        code: 'ACCOUNT_LOCKED' 
      });
    }
    
    // Update session activity
    await prisma.adminSession.update({
      where: { id: session.id },
      data: { 
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
    
    // Clean up old sessions periodically
    if (Math.random() < 0.1) { // 10% chance
      await prisma.adminSession.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isActive: false },
          ]
        }
      });
    }
    
    // Set admin data on request
    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role as 'ADMIN' | 'SUPER_ADMIN',
      sessionId: session.id,
    };
    
    // Log successful authentication using valid enum
    await logSystemActivity({
      activityType: 'ADMIN_SESSION_VALIDATED', // Will be mapped to ADMIN_LOGIN
      category: 'AUTHENTICATION',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: admin.id,
      actorEmail: admin.email,
      ipAddress: clientIP,
      userAgent,
      description: `Admin session validated for ${admin.email}`,
      success: true,
      metadata: {
        sessionId: session.id,
        endpoint: req.originalUrl,
        method: req.method,
      }
    });
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    await logSystemActivity({
      activityType: 'SYSTEM_ERROR',
      category: 'ERROR',
      severity: 'ERROR',
      actorType: 'SYSTEM',
      ipAddress: clientIP,
      userAgent,
      description: `Authentication middleware error: ${error}`,
      success: false,
      metadata: {
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    });
    
    return res.status(500).json({ 
      error: 'Authentication system error',
      code: 'AUTH_SYSTEM_ERROR' 
    });
  }
};

// Role-based access control
export const requireRole = (allowedRoles: ('ADMIN' | 'SUPER_ADMIN')[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      });
    }
    
    if (!allowedRoles.includes(req.admin.role)) {
      const clientIP = getClientIP(req);
      const userAgent = req.get('User-Agent') || '';
      
      await logSecurityEvent({
        eventType: 'PERMISSION_ESCALATION_ATTEMPT',
        severity: 'HIGH',
        adminId: req.admin.id,
        ipAddress: clientIP,
        userAgent,
        description: `Admin ${req.admin.email} attempted to access ${req.originalUrl} without sufficient permissions`,
        metadata: {
          requiredRoles: allowedRoles,
          adminRole: req.admin.role,
          endpoint: req.originalUrl,
          method: req.method,
        }
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.admin.role 
      });
    }
    
    next();
  };
};

export const requireSuperAdmin = requireRole(['SUPER_ADMIN']);
export const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);