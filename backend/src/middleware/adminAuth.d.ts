import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    admin?: {
        id: string;
        email: string;
        role: 'ADMIN' | 'SUPER_ADMIN';
        sessionId: string;
    };
}
export declare const authRateLimit: import("express-rate-limit").RateLimitRequestHandler;
export declare const adminAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireRole: (allowedRoles: ("ADMIN" | "SUPER_ADMIN")[]) => (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireSuperAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=adminAuth.d.ts.map