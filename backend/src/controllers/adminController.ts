import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
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
  try {
    const { email } = loginSchema.parse(req.body);
    
    // Check if admin exists
    const admin = await prisma.admin.findFirst({
      where: { email, isActive: true }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Admin not found or inactive' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Log admin login
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        action: 'LOGIN',
        ipAddress: req.ip || 'unknown',
        details: { userAgent: req.get('User-Agent') }
      }
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
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

    // Create the event - Fix the optional field issue
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

    // Only add optional fields if they exist
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
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        action: 'CREATE_EVENT',
        entityId: event.id,
        ipAddress: req.ip || 'unknown',
        details: { eventName: event.name, slug: event.slug }
      }
    });

    const nominationLink = `${process.env.FRONTEND_URL}/nominate/${slug}`;

    // Fix the response object - remove duplicate properties
    res.status(201).json({
      message: 'Event created successfully',
      event: {
        ...event,
        nominationLink,
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.issues // Fix: use 'issues' instead of 'errors'
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
    await prisma.adminAuditLog.create({
      data: {
        adminId: req.admin!.id,
        action: 'UPDATE_TIME_SETTINGS',
        entityId: event.id,
        ipAddress: req.ip || 'unknown',
        details: { enableTimeCheck, enableNominationTime, enableWithdrawalTime }
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