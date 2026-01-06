import { Elysia } from 'elysia';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { videoRoutes } from './video.routes';
import { adminRoutes } from './admin.routes';

// Export all routes combined
export const routes = new Elysia()
  .use(authRoutes)
  .use(userRoutes)
  .use(videoRoutes)
  .use(adminRoutes);