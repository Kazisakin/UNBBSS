import { Request } from 'express';

export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const socketIp = req.socket.remoteAddress;

  if (typeof forwarded === 'string' && forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (typeof realIp === 'string' && realIp) {
    return realIp;
  }
  if (socketIp !== undefined && socketIp !== null) {
    return socketIp === '::1' ? '127.0.0.1' : socketIp;
  }

  return 'unknown';
}

export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

export async function getLocationFromIP(ip: string): Promise<string | null> {
  // For development, return mock location
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === 'unknown') {
    return 'Local Development';
  }

  // In production, you could use a service like ipinfo.io
  // For now, return null to avoid external API calls
  return null;
}

export function logSecurityEvent(
  type: string,
  ip: string,
  userAgent: string,
  details?: any
) {
  console.log(`[SECURITY] ${new Date().toISOString()} - ${type}`, {
    ip,
    userAgent: userAgent.substring(0, 100), // Truncate long user agents
    details,
  });
}