import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { z } from 'zod';
import { getClientIP, getUserAgent, getLocationFromIP, logSecurityEvent } from '../services/locationService';

const prisma = new PrismaClient();

// Validation schemas
const requestVoteOtpSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@unb.ca')),
  slug: z.string().min(1),
});

const verifyVoteOtpSchema = z.object({
  token: z.string().min(1),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

const submitVoteSchema = z.object({
  voterFirstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
  voterLastName: z.string().min(1).max(50).regex(/^[a-zA-Z\s'-]+$/),
  voterStudentId: z.string().regex(/^\d{7}$/).refine(id => parseInt(id) > 3000000),
  voterFaculty: z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/),
  voterYear: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']),
  ballot: z.record(z.string(), z.string()), // {position: candidateId}
});

const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const getVotingEventDetails = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: 'Slug is required' });
    }

    const event = await prisma.votingEvent.findFirst({
      where: { slug, isActive: true },
      include: {
        candidates: {
          orderBy: { firstName: 'asc' }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Voting event not found' });
    }

    // Check if voting is currently open
    const now = new Date();
    const isOpen = !event.enableTimeCheck || !event.enableVotingTime ||
                   (now >= event.votingStartTime && now <= event.votingEndTime);

    // Group candidates by position
    const candidatesByPosition: Record<string, any[]> = {};
    const positions = ['President', 'Vice President', 'General Secretary', 'Treasurer', 'Event Coordinator', 'Webmaster'];

    positions.forEach(position => {
      candidatesByPosition[position] = event.candidates.filter(c =>
        (c.positions as string[]).includes(position)
      );
    });

    res.json({
      event: {
        id: event.id,
        name: event.name,
        description: event.description,
        rules: event.rules,
        votingStartTime: event.votingStartTime,
        votingEndTime: event.votingEndTime,
        isOpen,
        candidatesByPosition,
      }
    });
  } catch (error) {
    console.error('Get voting event details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requestVotingOtp = async (req: Request, res: Response) => {
  try {
    const { email, slug } = requestVoteOtpSchema.parse(req.body);
    const clientIP = getClientIP(req);

    const event = await prisma.votingEvent.findFirst({
      where: { slug, isActive: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Voting event not found' });
    }

    // Check if voting is open
    const now = new Date();
    if (event.enableTimeCheck && event.enableVotingTime) {
      if (now < event.votingStartTime || now > event.votingEndTime) {
        return res.status(403).json({ error: 'Voting period is not active' });
      }
    }

    // Check if email is eligible
    if (!event.eligibleEmails.includes(email)) {
      return res.status(403).json({ error: 'Your email is not eligible for this voting event' });
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: { voterEmail_eventId: { voterEmail: email, eventId: event.id } }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted in this event' });
    }

    // Generate OTP and token
    const otp = generateOTP();
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.voteToken.upsert({
      where: { email_eventId: { email, eventId: event.id } },
      update: {
        otp,
        token,
        expiresAt,
        isUsed: false,
        attempts: 0,
        ipAddress: clientIP,
      },
      create: {
        eventId: event.id,
        email,
        otp,
        token,
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
      subject: `Voting Verification - ${event.name}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #10b981; margin-bottom: 10px;">🗳️ Voting Access Code</h2>
            <h3 style="color: #ffffff; margin: 0;">${event.name}</h3>
          </div>
          
          <div style="background: #2d2d2d; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="color: #d1d5db; margin-bottom: 15px;">Your secure voting access code:</p>
            <div style="background: #059669; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 15px; border-radius: 8px; display: inline-block;">
              ${otp}
            </div>
          </div>
          
          <div style="background: #1e40af20; border: 1px solid #1e40af; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #93c5fd; margin: 0; font-size: 14px;">
              🔒 <strong>Security Notice:</strong> This code expires in 30 minutes. Do not share this code with anyone. Your vote is confidential and secure.
            </p>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            If you didn't request this voting code, please ignore this email.
          </p>
        </div>
      `,
    });

    logSecurityEvent('VOTING_OTP_REQUESTED', clientIP, getUserAgent(req), {
      email: email.split('@')[0] + '@***',
      eventId: event.id,
    });

    res.json({ token });
  } catch (error) {
    console.error('Request voting OTP error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyVotingOtp = async (req: Request, res: Response) => {
  try {
    const { token, otp } = verifyVoteOtpSchema.parse(req.body);

    const voteToken = await prisma.voteToken.findFirst({
      where: {
        token,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      include: { event: true },
    });

    if (!voteToken) {
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    if (voteToken.attempts >= voteToken.maxAttempts) {
      return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
    }

    if (voteToken.otp !== otp) {
      await prisma.voteToken.update({
        where: { id: voteToken.id },
        data: { attempts: { increment: 1 } },
      });
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Mark as used
    await prisma.voteToken.update({
      where: { id: voteToken.id },
      data: { isUsed: true, usedAt: new Date() },
    });

    // Generate voting session
    const sessionToken = jwt.sign(
      {
        email: voteToken.email,
        eventId: voteToken.eventId,
        type: 'voting',
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      },
      process.env.JWT_SECRET!
    );

    res.cookie('votingSession', sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      domain: 'localhost',
    });

    logSecurityEvent('VOTING_OTP_VERIFIED', req.ip || 'unknown', getUserAgent(req), {
      email: voteToken.email.split('@')[0] + '@***',
      eventId: voteToken.eventId,
    });

    res.json({ message: 'Verification successful' });
  } catch (error) {
    console.error('Verify voting OTP error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitVote = async (req: Request, res: Response) => {
  try {
    const sessionToken = req.cookies.votingSession;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Voting session required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(sessionToken, process.env.JWT_SECRET!) as {
        email: string;
        eventId: string;
        type: string;
      };
    } catch {
      return res.status(401).json({ error: 'Invalid voting session' });
    }

    if (decoded.type !== 'voting') {
      return res.status(401).json({ error: 'Invalid session type' });
    }

    const voteData = submitVoteSchema.parse(req.body);
    const clientIP = getClientIP(req);
    const userAgent = getUserAgent(req);
    const location = await getLocationFromIP(clientIP);

    const event = await prisma.votingEvent.findUnique({
      where: { id: decoded.eventId },
      include: { candidates: true }
    });

    if (!event) {
      return res.status(404).json({ error: 'Voting event not found' });
    }

    // Check voting period
    const now = new Date();
    if (event.enableTimeCheck && event.enableVotingTime) {
      if (now < event.votingStartTime || now > event.votingEndTime) {
        return res.status(403).json({ error: 'Voting period is not active' });
      }
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: { voterEmail_eventId: { voterEmail: decoded.email, eventId: event.id } }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted' });
    }

    // Validate ballot - ensure all selected candidates exist
    const candidateIds = Object.values(voteData.ballot);
    const validCandidates = await prisma.candidate.findMany({
      where: {
        id: { in: candidateIds },
        eventId: event.id,
      }
    });

    if (validCandidates.length !== candidateIds.length) {
      return res.status(400).json({ error: 'Invalid candidate selection' });
    }

    // Create the vote record
    const vote = await prisma.vote.create({
      data: {
        eventId: event.id,
        voterEmail: decoded.email,
        voterFirstName: voteData.voterFirstName,
        voterLastName: voteData.voterLastName,
        voterStudentId: voteData.voterStudentId,
        voterFaculty: voteData.voterFaculty,
        voterYear: voteData.voterYear,
        ballot: voteData.ballot,
        ipAddress: clientIP,
        location,
        userAgent,
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

    // Get candidate details for receipt
    const ballotDetails = await Promise.all(
      Object.entries(voteData.ballot).map(async ([position, candidateId]) => {
        const candidate = await prisma.candidate.findUnique({
          where: { id: candidateId }
        });
        return {
          position,
          candidate: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Unknown'
        };
      })
    );

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@unb.ca',
      to: decoded.email,
      subject: `Vote Confirmation - ${event.name}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background: #1a1a1a; color: #ffffff; padding: 20px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #10b981; margin-bottom: 10px;">✅ Vote Confirmed</h2>
            <h3 style="color: #ffffff; margin: 0;">${event.name}</h3>
          </div>
          
          <div style="background: #2d2d2d; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #10b981; margin-top: 0;">Voter Information:</h4>
            <p style="color: #d1d5db; margin: 5px 0;"><strong>Name:</strong> ${voteData.voterFirstName} ${voteData.voterLastName}</p>
            <p style="color: #d1d5db; margin: 5px 0;"><strong>Student ID:</strong> ${voteData.voterStudentId}</p>
            <p style="color: #d1d5db; margin: 5px 0;"><strong>Faculty:</strong> ${voteData.voterFaculty}</p>
            <p style="color: #d1d5db; margin: 5px 0;"><strong>Year:</strong> ${voteData.voterYear}</p>
          </div>
          
          <div style="background: #2d2d2d; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #10b981; margin-top: 0;">Your Votes:</h4>
            ${ballotDetails.map(({ position, candidate }) => 
              `<p style="color: #d1d5db; margin: 5px 0;"><strong>${position}:</strong> ${candidate}</p>`
            ).join('')}
          </div>
          
          <div style="background: #1e40af20; border: 1px solid #1e40af; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #93c5fd; margin: 0; font-size: 14px;">
              🔒 <strong>Confirmation:</strong> Your vote has been securely recorded. This email serves as your receipt. Keep this for your records.
            </p>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
            Vote ID: ${vote.id}<br>
            Submitted: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    // Clear voting session
    res.clearCookie('votingSession');

    logSecurityEvent('VOTE_SUBMITTED', clientIP, userAgent, {
      email: decoded.email.split('@')[0] + '@***',
      eventId: event.id,
      voteId: vote.id,
    });

    res.json({ message: 'Vote submitted successfully' });
  } catch (error) {
    console.error('Submit vote error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};