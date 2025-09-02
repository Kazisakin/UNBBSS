import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
  };
}

export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string };
    
    // Check if admin exists and is active
    const admin = await prisma.admin.findFirst({
      where: { id: decoded.id, isActive: true }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid token or inactive admin.' });
    }

    req.admin = { id: admin.id, email: admin.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};