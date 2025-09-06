import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

// Helper function to get client IP
const getClientIP = (req: Request): string => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         '127.0.0.1';
};

// Helper function to log system activities
const logSystemActivity = async (data: {
  activityType: string;
  category: string;
  severity?: string;
  actorType: string;
  actorId?: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  targetEmail?: string;
  ipAddress: string;
  userAgent?: string;
  description: string;
  success: boolean;
  metadata?: any;
  req?: Request;
}) => {
  try {
    await prisma.systemActivity.create({
      data: {
        activityType: data.activityType as any,
        category: data.category as any,
        severity: (data.severity || 'INFO') as any,
        actorType: data.actorType as any,
        actorId: data.actorId ?? null,
        actorEmail: data.actorEmail ?? null,
        targetType: data.targetType ?? null,
        targetId: data.targetId ?? null,
        targetEmail: data.targetEmail ?? null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent ?? null,
        description: data.description,
        success: data.success,
        metadata: data.metadata ?? null,
      }
    });
  } catch (error) {
    console.error('Failed to log system activity:', error);
  }
};

// Helper function to log authentication attempts
const logAuthAttempt = async (data: {
  userType: string;
  userId?: string;
  email?: string;
  authType: string;
  success: boolean;
  failureReason?: string;
  ipAddress: string;
  userAgent?: string;
  sessionId?: string;
}) => {
  try {
    await prisma.authenticationLog.create({
      data: {
        userType: data.userType as any,
        userId: data.userId ?? null,
        email: data.email ?? null,
        authType: data.authType as any,
        success: data.success,
        failureReason: data.failureReason ?? null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent ?? null,
        sessionId: data.sessionId ?? null,
      }
    });
  } catch (error) {
    console.error('Failed to log auth attempt:', error);
  }
};

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createEventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  rules: z.string().optional(),
  nominationStartTime: z.string().datetime(),
  nominationEndTime: z.string().datetime(),
  withdrawalStartTime: z.string().datetime(),
  withdrawalEndTime: z.string().datetime(),
  eligibleEmails: z.array(z.string().email()),
  enableTimeCheck: z.boolean().default(true),
  enableNominationTime: z.boolean().default(true),
  enableWithdrawalTime: z.boolean().default(true),
});

export const adminLogin = async (req: Request, res: Response) => {
  const clientIP = getClientIP(req);
  const userAgent = req.get('User-Agent');
  
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Log login attempt
    await logAuthAttempt({
      userType: 'ADMIN',
      email,
      authType: 'LOGIN_ATTEMPT',
      success: false, // Will update if successful
      ipAddress: clientIP,
      ...(userAgent && { userAgent }),
    });
    
    // Find admin
    const admin = await prisma.admin.findFirst({
      where: { email, isActive: true }
    });

    if (!admin) {
      await logSystemActivity({
        activityType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        category: 'SECURITY',
        severity: 'WARNING',
        actorType: 'ANONYMOUS',
        actorEmail: email,
        ipAddress: clientIP,
        userAgent: userAgent || '',
        description: `Failed login attempt for non-existent admin: ${email}`,
        success: false,
      });
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (admin.isLocked || (admin.lockedUntil && new Date() < admin.lockedUntil)) {
      await logSystemActivity({
        activityType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        category: 'SECURITY',
        severity: 'WARNING',
        actorType: 'ADMIN',
        actorId: admin.id,
        actorEmail: admin.email,
        ipAddress: clientIP,
        userAgent: userAgent || '',
        description: `Login attempt on locked account: ${admin.email}`,
        success: false,
      });
      
      return res.status(423).json({ error: 'Account is locked' });
    }

    // Verify password
    const isValidPassword = await argon2.verify(admin.passwordHash, password + admin.salt);

    if (!isValidPassword) {
      // Increment failed attempts
      const newFailedAttempts = admin.failedAttempts + 1;
      const shouldLock = newFailedAttempts >= 5;
      
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          failedAttempts: newFailedAttempts,
          ...(shouldLock && {
            isLocked: true,
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
          })
        }
      });

      await logAuthAttempt({
        userType: 'ADMIN',
        userId: admin.id,
        email: admin.email,
        authType: 'LOGIN_ATTEMPT',
        success: false,
        failureReason: 'Invalid password',
        ipAddress: clientIP,
        ...(userAgent && { userAgent }),
      });

      if (shouldLock) {
        await logSystemActivity({
          activityType: 'ACCOUNT_LOCKOUT',
          category: 'SECURITY',
          severity: 'HIGH',
          actorType: 'SYSTEM',
          targetType: 'Admin',
          targetId: admin.id,
          targetEmail: admin.email,
          ipAddress: clientIP,
          userAgent: userAgent || '',
          description: `Account locked after ${newFailedAttempts} failed attempts`,
          success: true,
        });
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts on successful login
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        failedAttempts: 0,
        lastLoginAt: new Date(),
        isLocked: false,
        lockedUntil: null,
      }
    });

    // Create JWT token
    const sessionId = randomBytes(16).toString('hex');
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        role: admin.role,
        sessionId 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Create admin session
    await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        sessionToken: token,
        ipAddress: clientIP,
        userAgent: userAgent || '',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    });

    // Log successful login
    await logAuthAttempt({
      userType: 'ADMIN',
      userId: admin.id,
      email: admin.email,
      authType: 'LOGIN_ATTEMPT',
      success: true,
      ipAddress: clientIP,
      ...(userAgent && { userAgent }),
      sessionId,
    });

    await logSystemActivity({
      activityType: 'ADMIN_LOGIN',
      category: 'AUTHENTICATION',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: admin.id,
      actorEmail: admin.email,
      ipAddress: clientIP,
      userAgent: userAgent || '',
      description: `Admin ${admin.email} logged in successfully`,
      success: true,
      metadata: {
        role: admin.role,
        sessionId,
        mustChangePassword: admin.mustChangePassword,
      }
    });

    // Log admin audit
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'LOGIN',
        ipAddress: clientIP,
        userAgent: userAgent || null,
        success: true,
        details: { 
          sessionId,
          role: admin.role,
        }
      }
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
        twoFactorEnabled: admin.twoFactorEnabled,
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    
    await logSystemActivity({
      activityType: 'SYSTEM_ERROR',
      category: 'ERROR',
      severity: 'ERROR',
      actorType: 'SYSTEM',
      ipAddress: clientIP,
      userAgent: userAgent || '',
      description: `Login system error: ${error}`,
      success: false,
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Make sure this function exists in your adminController.ts file
// If it doesn't exist, add it:

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        twoFactorEnabled: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    console.log('Profile request successful for:', admin.email);

    res.json(admin);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
export const adminLogout = async (req: AuthRequest, res: Response) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (sessionToken) {
      // Revoke the session
      await prisma.adminSession.updateMany({
        where: { 
          sessionToken,
          adminId: req.admin!.id 
        },
        data: { 
          isActive: false,
          revokedAt: new Date(),
        }
      });
    }

    // Log logout
    const userAgent = req.get('User-Agent');
    await logAuthAttempt({
      userType: 'ADMIN',
      userId: req.admin!.id,
      email: req.admin!.email,
      authType: 'LOGOUT',
      success: true,
      ipAddress: getClientIP(req),
      ...(userAgent && { userAgent }),
    });

    await logSystemActivity({
      activityType: 'ADMIN_LOGOUT',
      category: 'AUTHENTICATION',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} logged out`,
      success: true,
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createNominationEvent = async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventSchema.parse(req.body);
    
    // Generate slug from name
    const slug = data.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();

    // Check if slug already exists
    const existingEvent = await prisma.nominationEvent.findUnique({
      where: { slug }
    });

    if (existingEvent) {
      return res.status(400).json({ error: 'Event name already exists' });
    }

    // Validate time sequence
    const nomStart = new Date(data.nominationStartTime);
    const nomEnd = new Date(data.nominationEndTime);
    const withStart = new Date(data.withdrawalStartTime);
    const withEnd = new Date(data.withdrawalEndTime);

    if (nomStart >= nomEnd) {
      return res.status(400).json({ error: 'Nomination end time must be after start time' });
    }
    
    if (withStart >= withEnd) {
      return res.status(400).json({ error: 'Withdrawal end time must be after start time' });
    }

    // Create the event
    const eventData: any = {
      name: data.name,
      slug,
      nominationStartTime: nomStart,
      nominationEndTime: nomEnd,
      withdrawalStartTime: withStart,
      withdrawalEndTime: withEnd,
      eligibleEmails: data.eligibleEmails,
      enableTimeCheck: data.enableTimeCheck,
      enableNominationTime: data.enableNominationTime,
      enableWithdrawalTime: data.enableWithdrawalTime,
      createdById: req.admin!.id,
    };

    if (data.description !== undefined) {
      eventData.description = data.description;
    }
    if (data.rules !== undefined) {
      eventData.rules = data.rules;
    }

    const event = await prisma.nominationEvent.create({
      data: eventData
    });

    // Log the creation
    await logSystemActivity({
      activityType: 'NOMINATION_EVENT_CREATED',
      category: 'EVENT_MANAGEMENT',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      targetType: 'NominationEvent',
      targetId: event.id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} created nomination event: ${event.name}`,
      success: true,
      metadata: {
        eventSlug: event.slug,
        eligibleVoterCount: data.eligibleEmails.length,
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        action: 'CREATE_NOMINATION_EVENT',
        entityType: 'NominationEvent',
        entityId: event.id,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || null,
        success: true,
        details: { 
          eventName: event.name, 
          slug: event.slug,
          eligibleVoterCount: data.eligibleEmails.length,
        }
      }
    });

    const nominationLink = `${process.env.FRONTEND_URL}/nominate/${slug}`;

    res.status(201).json({
      message: 'Event created successfully',
      event: {
        ...event,
        nominationLink,
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    
    await logSystemActivity({
      activityType: 'SYSTEM_ERROR',
      category: 'ERROR',
      severity: 'ERROR',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Failed to create nomination event: ${error}`,
      success: false,
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.issues
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.nominationEvent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            nominations: true
          }
        }
      }
    });

    // Log data access
    await logSystemActivity({
      activityType: 'SUBMISSIONS_VIEWED',
      category: 'DATA_ACCESS',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} viewed nomination events list`,
      success: true,
      metadata: {
        eventCount: events.length,
      }
    });

    res.json({ events });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEventTimeSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }
    
    const { enableTimeCheck, enableNominationTime, enableWithdrawalTime } = req.body;

    const event = await prisma.nominationEvent.update({
      where: { id: eventId as string },
      data: {
        enableTimeCheck: enableTimeCheck ?? undefined,
        enableNominationTime: enableNominationTime ?? undefined,
        enableWithdrawalTime: enableWithdrawalTime ?? undefined,
      },
    });

    // Log the change
    await logSystemActivity({
      activityType: 'EVENT_TIME_SETTINGS_CHANGED',
      category: 'EVENT_MANAGEMENT',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      targetType: 'NominationEvent',
      targetId: event.id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} updated time settings for event: ${event.name}`,
      success: true,
      metadata: {
        enableTimeCheck,
        enableNominationTime,
        enableWithdrawalTime,
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        action: 'UPDATE_NOMINATION_EVENT',
        entityType: 'NominationEvent',
        entityId: event.id,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || null,
        success: true,
        details: { 
          eventName: event.name,
          changes: { enableTimeCheck, enableNominationTime, enableWithdrawalTime }
        }
      }
    });

    res.json({ 
      message: 'Time settings updated',
      event: {
        id: event.id,
        name: event.name,
        enableTimeCheck: event.enableTimeCheck,
        enableNominationTime: event.enableNominationTime,
        enableWithdrawalTime: event.enableWithdrawalTime,
      }
    });
  } catch (error) {
    console.error('Update time settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add all your other existing methods here with similar logging enhancements...
// For brevity, I'll include a few key ones:

export const createVotingEvent = async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      rules: z.string().optional(),
      votingStartTime: z.string().datetime(),
      votingEndTime: z.string().datetime(),
      eligibleEmails: z.array(z.string().email()),
      candidates: z.array(z.object({
        firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
        lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
        studentId: z.string().regex(/^\d{7}$/).refine(id => parseInt(id) > 3000000),
        faculty: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
        year: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']),
        positions: z.array(z.enum(['President', 'Vice President', 'General Secretary', 'Treasurer', 'Event Coordinator', 'Webmaster'])).min(1),
      })),
    }).parse(req.body);

    // Generate slug
    const slug = data.name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Check if slug exists
    const existingEvent = await prisma.votingEvent.findUnique({
      where: { slug }
    });

    if (existingEvent) {
      return res.status(400).json({ error: 'Event name already exists' });
    }

    // Validate time sequence
    const votingStart = new Date(data.votingStartTime);
    const votingEnd = new Date(data.votingEndTime);

    if (votingStart >= votingEnd) {
      return res.status(400).json({ error: 'Voting end time must be after start time' });
    }

    // Create event with candidates
    const event = await prisma.votingEvent.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        rules: data.rules ?? null,
        slug,
        votingStartTime: votingStart,
        votingEndTime: votingEnd,
        eligibleEmails: data.eligibleEmails,
        createdById: req.admin!.id,
        candidates: {
          create: data.candidates.map(candidate => ({
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            studentId: candidate.studentId,
            faculty: candidate.faculty,
            year: candidate.year,
            positions: candidate.positions,
          }))
        }
      },
      include: {
        candidates: true,
        _count: {
          select: { votes: true }
        }
      }
    });

    // Log creation with comprehensive activity tracking
    await logSystemActivity({
      activityType: 'VOTING_EVENT_CREATED',
      category: 'EVENT_MANAGEMENT',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      targetType: 'VotingEvent',
      targetId: event.id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} created voting event: ${event.name}`,
      success: true,
      metadata: {
        eventSlug: event.slug,
        candidateCount: data.candidates.length,
        eligibleVoterCount: data.eligibleEmails.length,
        positions: data.candidates.flatMap(c => c.positions),
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        action: 'CREATE_VOTING_EVENT',
        entityType: 'VotingEvent',
        entityId: event.id,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || null,
        success: true,
        details: { 
          eventName: event.name, 
          slug: event.slug,
          candidateCount: data.candidates.length 
        }
      }
    });

    const votingLink = `${process.env.FRONTEND_URL}/vote/${slug}`;

    res.status(201).json({
      message: 'Voting event created successfully',
      event: {
        ...event,
        votingLink,
      }
    });
  } catch (error) {
    console.error('Create voting event error:', error);
    
    await logSystemActivity({
      activityType: 'SYSTEM_ERROR',
      category: 'ERROR',
      severity: 'ERROR',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Failed to create voting event: ${error}`,
      success: false,
    });
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Include all your other existing methods with similar enhancements...
// (getVotingEvents, getVotingResults, updateVotingEvent, etc.)

// New method to get system activities for dashboard
export const getSystemActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', category, severity, actorType } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (actorType) where.actorType = actorType;

    const activities = await prisma.systemActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: offset,
      include: {
        detailedAuditLogs: {
          select: {
            changeType: true,
            entityType: true,
            entityId: true,
          }
        }
      }
    });

    const totalCount = await prisma.systemActivity.count({ where });

    // Log the access to system activities
    await logSystemActivity({
      activityType: 'VIEW_AUDIT_LOG',
      category: 'AUDIT',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} viewed system activity logs`,
      success: true,
      metadata: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        filters: { category, severity, actorType },
        resultCount: activities.length,
      }
    });

    res.json({
      activities,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit as string)),
      }
    });
  } catch (error) {
    console.error('Get system activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Copy all your other existing methods here (getVotingEvents, updateVotingEvent, etc.) 
// with similar logging enhancements...

export const getVotingEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await prisma.votingEvent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        candidates: true,
        _count: {
          select: { votes: true }
        }
      }
    });

    await logSystemActivity({
      activityType: 'RESULTS_VIEWED',
      category: 'DATA_ACCESS',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} viewed voting events list`,
      success: true,
      metadata: {
        eventCount: events.length,
      }
    });

    res.json({ events });
  } catch (error) {
    console.error('Get voting events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVotingResults = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const event = await prisma.votingEvent.findUnique({
      where: { id: eventId as string },
      include: {
        candidates: true,
        votes: true,
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Calculate results
    const positions = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'Event Coordinator', 'Webmaster'];
    const results: Record<string, any> = {};

    positions.forEach(position => {
      const candidatesForPosition = event.candidates.filter(c => 
        (c.positions as string[]).includes(position)
      );

      const voteCounts: Record<string, number> = {};
      candidatesForPosition.forEach(candidate => {
        voteCounts[candidate.id] = 0;
      });

      // Count votes for this position
      event.votes.forEach(vote => {
        const ballot = vote.ballot as Record<string, string>;
        const selectedCandidateId = ballot[position];
        if (selectedCandidateId && voteCounts.hasOwnProperty(selectedCandidateId)) {
          voteCounts[selectedCandidateId] = (voteCounts[selectedCandidateId] || 0) + 1;
        }
      });

      results[position] = {
        candidates: candidatesForPosition.map(candidate => ({
          id: candidate.id,
          name: `${candidate.firstName} ${candidate.lastName}`,
          faculty: candidate.faculty,
          year: candidate.year,
          votes: voteCounts[candidate.id] || 0,
        })),
        totalVotes: Object.values(voteCounts).reduce((sum, count) => sum + count, 0),
      };
    });

    // Voter statistics
    const voterStats = {
      totalEligible: event.eligibleEmails.length,
      totalVoted: event.votes.length,
      turnoutPercentage: ((event.votes.length / event.eligibleEmails.length) * 100).toFixed(1),
      notVoted: event.eligibleEmails.filter(email => 
        !event.votes.some(vote => vote.voterEmail === email)
      ),
    };

    // Log results access
    await logSystemActivity({
      activityType: 'RESULTS_VIEWED',
      category: 'DATA_ACCESS',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      targetType: 'VotingEvent',
      targetId: event.id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} viewed voting results for: ${event.name}`,
      success: true,
      metadata: {
        eventName: event.name,
        totalVotes: event.votes.length,
        turnoutPercentage: voterStats.turnoutPercentage,
      }
    });

    res.json({
      event: {
        id: event.id,
        name: event.name,
        votingStartTime: event.votingStartTime,
        votingEndTime: event.votingEndTime,
      },
      results,
      voterStats,
      votes: event.votes.map(vote => ({
        id: vote.id,
        voterName: `${vote.voterFirstName} ${vote.voterLastName}`,
        voterEmail: vote.voterEmail,
        voterStudentId: vote.voterStudentId,
        voterFaculty: vote.voterFaculty,
        voterYear: vote.voterYear,
        submittedAt: vote.submittedAt,
        ipAddress: vote.ipAddress,
        location: vote.location,
      }))
    });
  } catch (error) {
    console.error('Get voting results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVotingEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const updates = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      rules: z.string().optional(),
      votingStartTime: z.string().datetime().optional(),
      votingEndTime: z.string().datetime().optional(),
      enableTimeCheck: z.boolean().optional(),
      enableVotingTime: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }).parse(req.body);

    const event = await prisma.votingEvent.findUnique({
      where: { id: eventId as string }
    });

    if (!event) {
      return res.status(404).json({ error: 'Voting event not found' });
    }

    // Validate time sequence if times are being updated
    if (updates.votingStartTime || updates.votingEndTime) {
      const votingStart = updates.votingStartTime ? new Date(updates.votingStartTime) : event.votingStartTime;
      const votingEnd = updates.votingEndTime ? new Date(updates.votingEndTime) : event.votingEndTime;

      if (votingStart >= votingEnd) {
        return res.status(400).json({ error: 'Voting end time must be after start time' });
      }
    }

    // Build update data
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.rules !== undefined) updateData.rules = updates.rules;
    if (updates.votingStartTime !== undefined) updateData.votingStartTime = new Date(updates.votingStartTime);
    if (updates.votingEndTime !== undefined) updateData.votingEndTime = new Date(updates.votingEndTime);
    if (updates.enableTimeCheck !== undefined) updateData.enableTimeCheck = updates.enableTimeCheck;
    if (updates.enableVotingTime !== undefined) updateData.enableVotingTime = updates.enableVotingTime;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    
    const updatedEvent = await prisma.votingEvent.update({
      where: { id: eventId as string },
      data: updateData,
      include: {
        candidates: true,
        _count: {
          select: { votes: true }
        }
      }
    });

    // Log update with detailed tracking
    await logSystemActivity({
      activityType: 'VOTING_EVENT_UPDATED',
      category: 'EVENT_MANAGEMENT',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      targetType: 'VotingEvent',
      targetId: event.id,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} updated voting event: ${event.name}`,
      success: true,
      metadata: {
        changes: updates,
        eventName: updatedEvent.name,
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        action: 'UPDATE_VOTING_EVENT',
        entityType: 'VotingEvent',
        entityId: eventId || null,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || null,
        success: true,
        oldValues: event,
        newValues: updatedEvent,
        details: { 
          updates,
          eventName: updatedEvent.name 
        }
      }
    });

    res.json({
      message: 'Voting event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update voting event error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getNominationSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const nominations = await prisma.nomination.findMany({
      where: {
        isWithdrawn: false,
        event: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      include: {
        event: {
          select: { name: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    const suggestions = nominations.map(nom => ({
      firstName: nom.firstName,
      lastName: nom.lastName,
      studentId: nom.studentId,
      faculty: nom.faculty,
      year: nom.year,
      positions: nom.positions,
      eventName: nom.event.name,
    }));

    await logSystemActivity({
      activityType: 'SUBMISSIONS_VIEWED',
      category: 'DATA_ACCESS',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} viewed nomination suggestions`,
      success: true,
      metadata: {
        suggestionCount: suggestions.length,
      }
    });

    res.json({ suggestions });
  } catch (error) {
    console.error('Get nomination suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    const submissions = await prisma.nomination.findMany({
      where: { eventId: eventId as string },
      include: {
        event: {
          select: { name: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      email: sub.email,
      firstName: sub.firstName,
      lastName: sub.lastName,
      studentId: sub.studentId,
      faculty: sub.faculty,
      year: sub.year,
      positions: sub.positions,
      isWithdrawn: sub.isWithdrawn,
      withdrawnAt: sub.withdrawnAt,
      withdrawnPositions: sub.withdrawnPositions,
      submittedAt: sub.submittedAt,
      ipAddress: sub.ipAddress,
      location: sub.location,
      eventName: sub.event?.name || 'Unknown Event',
    }));

    // Log detailed data access
    await logSystemActivity({
      activityType: 'SUBMISSIONS_VIEWED',
      category: 'DATA_ACCESS',
      severity: 'INFO',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      targetType: 'NominationEvent',
      targetId: eventId,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} viewed submissions for event`,
      success: true,
      metadata: {
        eventId,
        submissionCount: submissions.length,
        activeSubmissions: submissions.filter(s => !s.isWithdrawn).length,
        withdrawnSubmissions: submissions.filter(s => s.isWithdrawn).length,
      }
    });

    res.json({ submissions: formattedSubmissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportEventData = async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { format } = req.query;

    if (!eventId || typeof eventId !== 'string') {
      return res.status(400).json({ error: 'Valid event ID is required' });
    }

    const event = await prisma.nominationEvent.findUnique({
      where: { id: eventId },
      include: {
        nominations: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let exportData;
    let contentType = 'application/json';
    let filename = `nominations-${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}`;

    if (format === 'csv') {
      const csvData = event.nominations.map(nom => ({
        Email: nom.email,
        'First Name': nom.firstName,
        'Last Name': nom.lastName,
        'Student ID': nom.studentId,
        Faculty: nom.faculty,
        Year: nom.year,
        Positions: (nom.positions as string[]).join('; '),
        'Is Withdrawn': nom.isWithdrawn ? 'Yes' : 'No',
        'Submitted At': nom.submittedAt.toISOString(),
        'IP Address': nom.ipAddress,
        Location: nom.location || 'N/A',
      }));

      const csvHeader = Object.keys(csvData[0] || {}).join(',');
      const csvRows = csvData.map(row => Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(','));
      exportData = [csvHeader, ...csvRows].join('\n');
      contentType = 'text/csv';
      filename += '.csv';
    } else {
      exportData = JSON.stringify({ event, submissions: event.nominations }, null, 2);
      filename += '.json';
    }

    // Log comprehensive export activity
    await logSystemActivity({
      activityType: 'DATA_EXPORTED',
      category: 'DATA_ACCESS',
      severity: 'WARNING', // Higher severity for data exports
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      targetType: 'NominationEvent',
      targetId: eventId,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Admin ${req.admin!.email} exported ${typeof format === 'string' ? format.toUpperCase() : 'JSON'} data for event: ${event.name}`,
      success: true,
      metadata: {
        eventName: event.name,
        format: format || 'json',
        recordCount: event.nominations.length,
        exportSize: exportData.length,
        filename,
      }
    });

    await prisma.dataAccessLog.create({
      data: {
        accessorType: 'ADMIN',
        accessorId: req.admin!.id,
        accessorEmail: req.admin!.email,
        dataType: 'nominations',
        entityId: eventId,
        accessType: 'EXPORT',
        accessReason: `Export nominations data for event: ${event.name}`,
        exportFormat: (format as string) || 'json',
        exportSize: exportData.length,
        recordsReturned: event.nominations.length,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || null,
        sensitive: true, // Mark as sensitive since it contains PII
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        action: 'EXPORT_DATA',
        entityType: 'NominationEvent',
        entityId: eventId,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent') || null,
        success: true,
        details: { 
          format: format || 'json', 
          submissionCount: event.nominations.length,
          eventName: event.name,
        }
      }
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportData);

  } catch (error) {
    console.error('Export data error:', error);
    
    await logSystemActivity({
      activityType: 'SYSTEM_ERROR',
      category: 'ERROR',
      severity: 'ERROR',
      actorType: 'ADMIN',
      actorId: req.admin!.id,
      actorEmail: req.admin!.email,
      ipAddress: getClientIP(req),
      userAgent: req.get('User-Agent') || '',
      description: `Failed to export data: ${error}`,
      success: false,
      metadata: {
        eventId: req.params.eventId,
        format: req.query.format,
      }
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add these to your adminController.ts file

export const updateEvent = async (req: AuthRequest, res: Response) => {
  // Your update event logic here
  try {
    // Implementation needed
    res.status(200).json({ message: "Event updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
};

export const deleteVotingEvent = async (req: AuthRequest, res: Response) => {
  // Your delete voting event logic here
  try {
    // Implementation needed
    res.status(200).json({ message: "Voting event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete voting event" });
  }
};

export const extendVotingPeriod = async (req: AuthRequest, res: Response) => {
  // Your extend voting period logic here
  try {
    // Implementation needed
    res.status(200).json({ message: "Voting period extended successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to extend voting period" });
  }
};