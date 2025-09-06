"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitWithdrawal = exports.getNominationDetails = exports.verifyWithdrawalOtp = exports.requestWithdrawalOtp = void 0;
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const withdrawalRequestSchema = zod_1.z.object({
    token: zod_1.z.string().min(1),
});
const withdrawalSubmitSchema = zod_1.z.object({
    positions: zod_1.z.array(zod_1.z.string()).optional().default([]),
});
// Generate OTP for withdrawal verification
const generateOTP = () => {
    return crypto_1.default.randomInt(100000, 999999).toString();
};
const generateShortCode = () => {
    return crypto_1.default.randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 16);
};
const requestWithdrawalOtp = async (req, res) => {
    try {
        const { token } = withdrawalRequestSchema.parse(req.body);
        // Find nomination by withdrawal token
        const nomination = await prisma.nomination.findFirst({
            where: { withdrawalToken: token, isWithdrawn: false },
            include: { event: true }
        });
        if (!nomination) {
            return res.status(404).json({ error: 'Nomination not found or already withdrawn' });
        }
        // Check if withdrawal period is active
        const now = new Date();
        if (nomination.event.enableTimeCheck && nomination.event.enableWithdrawalTime) {
            if (now < nomination.event.withdrawalStartTime || now > nomination.event.withdrawalEndTime) {
                return res.status(403).json({ error: 'Withdrawal period is not active' });
            }
        }
        // Generate OTP and short code
        const otp = generateOTP();
        const shortCode = generateShortCode();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        // Store withdrawal token
        await prisma.withdrawalToken.upsert({
            where: { email_eventId: { email: nomination.email, eventId: nomination.eventId } },
            update: {
                otp,
                token: shortCode,
                expiresAt,
                isUsed: false,
                attempts: 0,
                ipAddress: req.ip || 'unknown',
            },
            create: {
                eventId: nomination.eventId,
                email: nomination.email,
                otp,
                token: shortCode,
                expiresAt,
                ipAddress: req.ip || 'unknown',
            },
        });
        // Send OTP email
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@unb.ca',
            to: nomination.email,
            subject: `Withdrawal Verification - ${nomination.event.name}`,
            html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2>Withdrawal Verification</h2>
          <p>Your OTP for withdrawing from ${nomination.event.name} is:</p>
          <div style="background: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 30 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
        });
        res.json({ shortCode });
    }
    catch (error) {
        console.error('Withdrawal OTP error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid input', details: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.requestWithdrawalOtp = requestWithdrawalOtp;
const verifyWithdrawalOtp = async (req, res) => {
    try {
        const { shortCode, otp } = req.body;
        const verification = await prisma.withdrawalToken.findFirst({
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
        if (verification.attempts >= verification.maxAttempts) {
            return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
        }
        if (verification.otp !== otp) {
            await prisma.withdrawalToken.update({
                where: { id: verification.id },
                data: { attempts: { increment: 1 } },
            });
            return res.status(401).json({ error: 'Invalid OTP' });
        }
        // Mark as used
        await prisma.withdrawalToken.update({
            where: { id: verification.id },
            data: { isUsed: true, usedAt: new Date() },
        });
        // Generate withdrawal session token
        const sessionToken = jsonwebtoken_1.default.sign({
            email: verification.email,
            eventId: verification.eventId,
            type: 'withdrawal',
            exp: Math.floor(Date.now() / 1000) + 30 * 60,
        }, process.env.JWT_SECRET);
        res.cookie('withdrawalToken', sessionToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 30 * 60 * 1000,
            domain: 'localhost',
        });
        res.json({ message: 'Verification successful' });
    }
    catch (error) {
        console.error('Verify withdrawal OTP error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.verifyWithdrawalOtp = verifyWithdrawalOtp;
const getNominationDetails = async (req, res) => {
    try {
        const sessionToken = req.cookies.withdrawalToken;
        if (!sessionToken) {
            return res.status(401).json({ error: 'Session required' });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(sessionToken, process.env.JWT_SECRET);
        }
        catch {
            return res.status(401).json({ error: 'Invalid session' });
        }
        if (decoded.type !== 'withdrawal') {
            return res.status(401).json({ error: 'Invalid session type' });
        }
        const nomination = await prisma.nomination.findFirst({
            where: {
                email: decoded.email,
                eventId: decoded.eventId,
                isWithdrawn: false,
            },
            include: { event: true },
        });
        if (!nomination) {
            return res.status(404).json({ error: 'Nomination not found' });
        }
        res.json({
            nomination: {
                email: nomination.email,
                firstName: nomination.firstName,
                lastName: nomination.lastName,
                studentId: nomination.studentId,
                faculty: nomination.faculty,
                year: nomination.year,
                positions: nomination.positions,
                eventName: nomination.event.name,
            },
        });
    }
    catch (error) {
        console.error('Get nomination details error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getNominationDetails = getNominationDetails;
const submitWithdrawal = async (req, res) => {
    try {
        console.log('=== WITHDRAWAL SUBMISSION DEBUG ===');
        console.log('Request body:', req.body);
        console.log('Cookies:', req.cookies);
        const sessionToken = req.cookies.withdrawalToken;
        if (!sessionToken) {
            return res.status(401).json({ error: 'Session required' });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(sessionToken, process.env.JWT_SECRET);
        }
        catch {
            return res.status(401).json({ error: 'Invalid session' });
        }
        let validatedData;
        try {
            validatedData = withdrawalSubmitSchema.parse(req.body);
            console.log('Validated data:', validatedData);
        }
        catch (error) {
            console.log('Validation error:', error);
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Invalid input',
                    details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
                });
            }
            return res.status(400).json({ error: 'Invalid input format' });
        }
        const { positions } = validatedData;
        const nomination = await prisma.nomination.findFirst({
            where: {
                email: decoded.email,
                eventId: decoded.eventId,
                isWithdrawn: false,
            },
            include: { event: true },
        });
        if (!nomination) {
            return res.status(404).json({ error: 'Nomination not found' });
        }
        // Check if nomination has already been withdrawn or partially withdrawn
        if (nomination.isWithdrawn || (nomination.withdrawnPositions && nomination.withdrawnPositions.length > 0)) {
            return res.status(400).json({ error: 'Nomination has already been withdrawn or partially withdrawn' });
        }
        // Check withdrawal period
        const now = new Date();
        if (nomination.event.enableTimeCheck && nomination.event.enableWithdrawalTime) {
            if (now < nomination.event.withdrawalStartTime || now > nomination.event.withdrawalEndTime) {
                return res.status(403).json({ error: 'Withdrawal period is not active' });
            }
        }
        const originalPositions = nomination.positions;
        const withdrawnPositions = originalPositions.filter(pos => !positions.includes(pos));
        console.log('Original positions:', originalPositions);
        console.log('Positions to keep:', positions);
        console.log('Positions to withdraw:', withdrawnPositions);
        let withdrawalType;
        let updatedNomination;
        if (positions.length === 0) {
            // Complete withdrawal
            withdrawalType = 'complete';
            updatedNomination = await prisma.nomination.update({
                where: { id: nomination.id },
                data: {
                    isWithdrawn: true,
                    withdrawnAt: new Date(),
                    withdrawnPositions: originalPositions,
                },
            });
        }
        else {
            // Partial withdrawal
            withdrawalType = 'partial';
            updatedNomination = await prisma.nomination.update({
                where: { id: nomination.id },
                data: {
                    positions: positions,
                    withdrawnAt: new Date(),
                    withdrawnPositions: withdrawnPositions,
                },
            });
        }
        // Send confirmation email
        const transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        const emailContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2>Nomination Withdrawal Confirmation</h2>
        <p>Your ${withdrawalType === 'complete' ? 'complete' : 'partial'} withdrawal from <strong>${nomination.event.name}</strong> has been processed successfully.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Details:</h3>
          <p><strong>Name:</strong> ${nomination.firstName} ${nomination.lastName}</p>
          <p><strong>Student ID:</strong> ${nomination.studentId}</p>
          <p><strong>Faculty:</strong> ${nomination.faculty}</p>
          <p><strong>Year:</strong> ${nomination.year}</p>
          ${withdrawalType === 'complete'
            ? `<p><strong>Withdrawn Positions:</strong> ${originalPositions.join(', ')}</p>`
            : `<p><strong>Withdrawn Positions:</strong> ${withdrawnPositions.join(', ')}</p>
                 <p><strong>Remaining Positions:</strong> ${positions.join(', ')}</p>`}
        </div>
        
        <p>This action cannot be undone. If you believe this was a mistake, please contact the election committee.</p>
        <p><small>Withdrawal processed on: ${new Date().toLocaleDateString()}</small></p>
      </div>
    `;
        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@unb.ca',
            to: nomination.email,
            subject: `Withdrawal Confirmation - ${nomination.event.name}`,
            html: emailContent,
        });
        // Clear withdrawal session
        res.clearCookie('withdrawalToken');
        res.json({ message: 'Withdrawal processed successfully' });
    }
    catch (error) {
        console.error('Submit withdrawal error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                error: 'Invalid input',
                details: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`),
            });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.submitWithdrawal = submitWithdrawal;
//# sourceMappingURL=withdrawalController.js.map