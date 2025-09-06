import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { z } from 'zod';
import { getClientIP, getUserAgent, getLocationFromIP, logSecurityEvent } from '../services/locationService';

const prisma = new PrismaClient();

// Validation schemas
const requestOtpSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@unb.ca')),
  slug: z.string().min(1),
});

const verifyOtpSchema = z.object({
  shortCode: z.string().min(1),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

const submitNominationSchema = z.object({
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
  lastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
  studentId: z.string().regex(/^\d{7}$/).refine(id => parseInt(id) > 3000000),
  faculty: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  year: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']),
  positions: z.array(z.enum(['President', 'Vice President', 'General Secretary', 'Treasurer', 'Event Coordinator', 'Webmaster'])).min(1),
});

// Generate secure OTP
const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate short code for verification
const generateShortCode = (): string => {
  return crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 16);
};

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const { email: rawEmail, slug } = requestOtpSchema.parse(req.body);
    const email = rawEmail.toLowerCase();
    const clientIP = getClientIP(req);

    // Find the nomination event
    const event = await prisma.nominationEvent.findFirst({
      where: { slug, isActive: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Nomination event not found' });
    }

    // Check if nominations are open
    const now = new Date();
    if (event.enableTimeCheck && event.enableNominationTime) {
      if (now < event.nominationStartTime || now > event.nominationEndTime) {
        return res.status(403).json({ error: 'Nomination period is not active' });
      }
    }

    // Check if email is eligible
    if (!event.eligibleEmails.includes(email)) {
      return res.status(403).json({ error: 'Your email is not eligible for this event' });
    }

    // Check if already submitted
    const existingNomination = await prisma.nomination.findUnique({
      where: { email_eventId: { email, eventId: event.id } }
    });

    if (existingNomination && !existingNomination.isWithdrawn) {
      return res.status(400).json({ error: 'You have already submitted a nomination for this event' });
    }

    // Generate OTP and short code
    const otp = generateOTP();
    const shortCode = generateShortCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Store verification token
    await prisma.verificationToken.upsert({
      where: { email_eventId: { email, eventId: event.id } },
      update: {
        otp,
        token: shortCode,
        expiresAt,
        isUsed: false,
        attempts: 0,
        ipAddress: clientIP,
      },
      create: {
        eventId: event.id,
        email,
        otp,
        token: shortCode,
        expiresAt,
        ipAddress: clientIP,
      },
    });

    // Send OTP email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@unb.ca',
      to: email,
      subject: `Nomination OTP for ${event.name}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>Nomination Verification</h2>
          <p>Your OTP for ${event.name} nomination is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 30 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ shortCode });
  } catch (error) {
    console.error('Request OTP error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { shortCode, otp } = verifyOtpSchema.parse(req.body);

    // Find verification token
    const verification = await prisma.verificationToken.findFirst({
      where: {
        token: shortCode,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { event: true },
    });

    if (!verification) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Check attempts
    if (verification.attempts >= verification.maxAttempts) {
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (verification.otp !== otp) {
      await prisma.verificationToken.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Mark as used
    await prisma.verificationToken.update({
      where: { id: verification.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    // Generate session token
    const sessionToken = jwt.sign(
      {
        email: verification.email.toLowerCase(),
        eventId: verification.eventId,
        exp: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      },
      process.env.JWT_SECRET!
    );

    // Set cookie with proper settings for localhost
    res.cookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: false, // Set to false for localhost development
      sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-origin
      maxAge: 30 * 60 * 1000, // 30 minutes
      domain: 'localhost', // Explicitly set domain for localhost
    });

    res.json({ 
      message: 'OTP verified successfully',
      eventName: verification.event.name,
      redirectTo: `/nominate/${verification.event.slug}/form` // Add redirect info
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitNomination = async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies.sessionToken;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Session required. Please verify your email first.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as {
        email: string;
        eventId: string;
        exp: number;
      };
    } catch {
      return res.status(401).json({ error: 'Invalid session. Please verify your email again.' });
    }

    const formData = submitNominationSchema.parse(req.body);
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = await getLocationFromIP(clientIP);

    // Log security event
    logSecurityEvent('NOMINATION_SUBMITTED', clientIP, userAgent, {
      email: decoded.email.split('@')[0] + '@***', // Masked email
      eventId: decoded.eventId,
    });

    // Get event
    const event = await prisma.nominationEvent.findUnique({
      where: { id: decoded.eventId }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check nomination period
    const now = new Date();
    if (event.enableTimeCheck && event.enableNominationTime) {
      if (now < event.nominationStartTime || now > event.nominationEndTime) {
        return res.status(403).json({ error: 'Nomination period is not active' });
      }
    }

    // Check for existing nomination
    const normalizedEmail = decoded.email.toLowerCase();
    const existingNomination = await prisma.nomination.findUnique({
    where: { email_eventId: { email: normalizedEmail, eventId: event.id } }
    });

    if (existingNomination && !existingNomination.isWithdrawn) {
      return res.status(400).json({ error: 'You have already submitted a nomination' });
    }

    // Generate withdrawal token
    const withdrawalToken = crypto.randomBytes(32).toString('hex');

    // Create nomination with location data
    const nomination = await prisma.nomination.create({
      data: {
        eventId: event.id,
        email: decoded.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentId: formData.studentId,
        faculty: formData.faculty,
        year: formData.year,
        positions: formData.positions,
        withdrawalToken,
        ipAddress: clientIP,
        location: location || null,
      },
    });

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    const withdrawalLink = `${process.env.FRONTEND_URL}/nominate/${event.slug}/withdraw?token=${withdrawalToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@unb.ca',
      to: decoded.email,
      subject: `Nomination Submitted - ${event.name}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>Nomination Submitted Successfully!</h2>
          <p>Your nomination for <strong>${event.name}</strong> has been submitted.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Details:</h3>
            <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
            <p><strong>Student ID:</strong> ${formData.studentId}</p>
            <p><strong>Faculty:</strong> ${formData.faculty}</p>
            <p><strong>Year:</strong> ${formData.year}</p>
            <p><strong>Positions:</strong> ${formData.positions.join(', ')}</p>
          </div>
          
          <p>If you need to withdraw or modify your nomination, you can do so during the withdrawal period using this link:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${withdrawalLink}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Withdraw Nomination</a>
          </div>
          
          <p><small>Withdrawal period: ${event.withdrawalStartTime.toLocaleDateString()} - ${event.withdrawalEndTime.toLocaleDateString()}</small></p>
        </div>
      `,
    });

    // Clear session cookie
    res.clearCookie('sessionToken');

    res.json({ message: 'Nomination submitted successfully!' });
  } catch (error) {
    console.error('Submit nomination error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ error: 'Event slug is required' });
    }

    const event = await prisma.nominationEvent.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        rules: true,
        nominationStartTime: true,
        nominationEndTime: true,
        enableTimeCheck: true,
        enableNominationTime: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if nominations are currently open
    const now = new Date();
    const isOpen = !event.enableTimeCheck || !event.enableNominationTime || 
                   (now >= event.nominationStartTime && now <= event.nominationEndTime);

    res.json({
      event: {
        ...event,
        isOpen,
      },
    });
  } catch (error) {
    console.error('Get event details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies.sessionToken;
    if (!sessionToken) {
      return res.status(401).json({ error: 'No session found' });
    }

    let decoded;
    try {
      decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as {
        email: string;
        eventId: string;
        exp: number;
      };
    } catch {
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Get event details
    const event = await prisma.nominationEvent.findUnique({
      where: { id: decoded.eventId },
      select: { name: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      email: decoded.email,
      eventName: event.name
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};