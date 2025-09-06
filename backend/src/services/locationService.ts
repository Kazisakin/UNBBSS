import { Request } from 'express';

export function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const socketIp = req.socket.remoteAddress;

  // Handle x-forwarded-for (string or string[])
  if (forwarded !== undefined && forwarded !== null) {
    if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
      // Instead of split, take the entire string as the first IP (assuming no commas)
      return forwarded.trim();
    } else if (Array.isArray(forwarded) && forwarded.length > 0 && typeof forwarded[0] === 'string' && forwarded[0].trim().length > 0) {
      return forwarded[0].trim();
    }
  }

  // Handle x-real-ip
  if (realIp !== undefined && realIp !== null && typeof realIp === 'string' && realIp.trim().length > 0) {
    return realIp.trim();
  }

  // Handle socket IP
  if (socketIp !== undefined && socketIp !== null && typeof socketIp === 'string' && socketIp.trim().length > 0) {
    return socketIp === '::1' ? '127.0.0.1' : socketIp.trim();
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