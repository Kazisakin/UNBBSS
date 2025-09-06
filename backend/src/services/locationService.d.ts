import { Request } from 'express';
export declare function getClientIP(req: Request): string;
export declare function getUserAgent(req: Request): string;
export declare function getLocationFromIP(ip: string): Promise<string | null>;
export declare function logSecurityEvent(type: string, ip: string, userAgent: string, details?: any): void;
//# sourceMappingURL=locationService.d.ts.map