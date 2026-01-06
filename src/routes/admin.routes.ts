import { Elysia } from 'elysia';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware, type AuthContext } from '../middleware/auth.middleware';

export const adminRoutes = new Elysia({ prefix: '/api/admin' })
  // All admin routes require authentication
  .derive(async (context: AuthContext) => {
    const result = await authMiddleware(context);
    if (result) return result;
    
    // TODO: In production, add role-based access control here
    // Check if user has admin role
    // For now, all authenticated users can access admin routes for testing
  })
  
  // ==================== USER MANAGEMENT ====================
  
  // Get all users with pagination
  .get('/users', async ({ query }: { query: any }) => {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');
    return await adminController.getAllUsers(page, limit);
  })
  
  // Get a specific user by ID
  .get('/users/:id', async ({ params }: { params: { id: string } }) => {
    return await adminController.getUserById(params.id);
  })
  
  // Update user's subscription tier
  .put('/users/:id/tier', async ({ params, body }: { params: { id: string }, body: any }) => {
    return await adminController.updateUserTier(params.id, body.tier);
  })
  
  // Suspend a user account
  .post('/users/:id/suspend', async ({ params }: { params: { id: string } }) => {
    return await adminController.suspendUser(params.id);
  })
  
  // ==================== MONITORING & ANALYTICS ====================
  
  // Get system-wide statistics
  .get('/stats', async () => {
    return await adminController.getSystemStats();
  })
  
  // Get upload logs with pagination
  .get('/logs/uploads', async ({ query }: { query: any }) => {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');
    return await adminController.getUploadLogs(page, limit);
  })
  
  // Get system health information
  .get('/health', async () => {
    return {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    };
  });