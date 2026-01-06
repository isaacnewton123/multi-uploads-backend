import jwt, { type SignOptions } from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface JWTPayload {
  userId: string;
  email: string;
  tier: string;
}

export const generateToken = (payload: JWTPayload): string => {
  const signOptions: SignOptions = {
    expiresIn: parseInt(ENV.JWT_EXPIRES_IN, 10),
  };
  return jwt.sign(payload, ENV.JWT_SECRET as string, signOptions);
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};