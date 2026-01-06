import { Elysia } from 'elysia';
import { videoController } from '../controllers/video.controller';
import { authMiddleware, type AuthContext } from '../middleware/auth.middleware';
import { quotaMiddleware } from '../middleware/quota.middleware';

export const videoRoutes = new Elysia({ prefix: '/api/videos' })
  // All video routes require authentication
  .derive(async (context: AuthContext) => {
    const result = await authMiddleware(context);
    if (result) return result;
  })
  
  // Get user's upload quota information
  .get('/quota', async ({ user }: AuthContext) => {
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    return await videoController.getQuota(user.userId);
  })
  
  // Upload a new video (requires quota check)
  .post('/upload', async ({ user, body }: AuthContext & { body: any }) => {
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    
    // Check quota before upload
    const quotaCheck = await quotaMiddleware({ user } as any);
    if (quotaCheck) return quotaCheck;
    
    // Get file from body (multipart form data)
    const file = (body as any).file;
    return await videoController.uploadVideo(user.userId, file, body);
  })
  
  // Get all videos for the current user
  .get('/', async ({ user }: AuthContext) => {
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    return await videoController.getUserVideos(user.userId);
  })
  
  // Get a specific video by ID
  .get('/:id', async ({ user, params }: AuthContext & { params: { id: string } }) => {
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    return await videoController.getVideo(user.userId, params.id);
  })
  
  // Delete a video
  .delete('/:id', async ({ user, params }: AuthContext & { params: { id: string } }) => {
    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }
    return await videoController.deleteVideo(user.userId, params.id);
  });