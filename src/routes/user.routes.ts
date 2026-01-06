import { Elysia } from 'elysia';
import { authController } from '../controllers/auth.controller';
import { authMiddleware, type AuthContext } from '../middleware/auth.middleware';

export const userRoutes = new Elysia({ prefix: '/api/user' })
  .derive(async (context: AuthContext) => {
    const result = await authMiddleware(context);
    if (result) return result;
  })
  
  .get('/profile', async ({ user }: AuthContext) => {
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    return await authController.getProfile(user.userId);
  })
  
  .put('/profile', async ({ user, body }: AuthContext & { body: any }) => {
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    // TODO: Implement profile update logic
    return {
      success: true,
      message: 'Profile update endpoint (to be implemented)',
    };
  });