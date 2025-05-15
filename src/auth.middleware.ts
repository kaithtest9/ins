import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from './utils';

// Extend Express Request type
declare global {
  namespace Express {
    export interface Request {
      user?: JwtPayload;
    }
  }
}

export function expressAuthentication(
  request: Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName === 'jwt') {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Promise.reject(new Error('No token provided or malformed token'));
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return Promise.reject(new Error('Invalid token'));
    }
    // Attach user to request for tsoa controllers
    request.user = decoded;
    return Promise.resolve(decoded);
  }
  return Promise.reject(new Error(`Unsupported security name: ${securityName}`));
}

// Standard middleware for routes not managed by tsoa (if any)
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    req.user = decoded;
    next();
};