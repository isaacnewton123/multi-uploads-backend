import { Elysia } from 'elysia';
import { authController } from '../controllers/auth.controller';
import { authMiddleware, type AuthContext } from '../middleware/auth.middleware';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  // Public routes
  .post('/register', async ({ body }) => {
    return await authController.register(body);
  })
  
  .post('/login', async ({ body }) => {
    return await authController.login(body);
  })
  
  .post('/verify-otp', async ({ body }) => {
    return await authController.verifyOTP(body);
  })
  
  .post('/resend-otp', async ({ body }) => {
    return await authController.resendOTP(body);
  })
  
  // Protected routes
  .group('/profile', (app) =>
    app
      .derive(async (context: AuthContext) => {
        const result = await authMiddleware(context);
        if (result) return result;
      })
      .get('/', async ({ user }: AuthContext) => {
        if (!user) {
          return { success: false, message: 'Unauthorized' };
        }
        return await authController.getProfile(user.userId);
      })
  );