import type { Context } from 'elysia';
import { verifyToken, type JWTPayload } from '../utils/jwt.util';

export interface AuthContext extends Context {
  user?: JWTPayload;
}

export const authMiddleware = async (context: AuthContext) => {
  const authHeader = context.request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    context.set.status = 401;
    return {
      success: false,
      message: 'Unauthorized. No token provided.',
    };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    context.set.status = 401;
    return {
      success: false,
      message: 'Unauthorized. Invalid or expired token.',
    };
  }

  // Attach user info to context
  context.user = decoded;
};