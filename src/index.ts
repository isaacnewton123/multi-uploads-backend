import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { connectDatabase } from './config/database';
import { ENV } from './config/env';
import { routes } from './routes';

// Import worker to start background processing
import './workers/video.worker';

// Connect to database
await connectDatabase();

// Create main application
const app = new Elysia()
  // Enable CORS
  .use(cors({
    origin: ENV.CORS_ORIGINS,
    credentials: true,
  }))
  
  // Health check endpoint
  .get('/api/health', () => ({
    success: true,
    message: 'Multi-Uploader API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }))
  
  // Root endpoint
  .get('/', () => ({
    success: true,
    message: 'Welcome to Multi-Uploader API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verifyOTP: 'POST /api/auth/verify-otp',
        resendOTP: 'POST /api/auth/resend-otp',
        profile: 'GET /api/auth/profile',
      },
      user: {
        profile: 'GET /api/user/profile',
        updateProfile: 'PUT /api/user/profile',
      },
      videos: {
        upload: 'POST /api/videos/upload',
        list: 'GET /api/videos',
        get: 'GET /api/videos/:id',
        delete: 'DELETE /api/videos/:id',
        quota: 'GET /api/videos/quota',
      },
      admin: {
        users: 'GET /api/admin/users',
        userById: 'GET /api/admin/users/:id',
        updateTier: 'PUT /api/admin/users/:id/tier',
        suspend: 'POST /api/admin/users/:id/suspend',
        stats: 'GET /api/admin/stats',
        uploadLogs: 'GET /api/admin/logs/uploads',
        health: 'GET /api/admin/health',
      },
    },
  }))
  
  // Mount all routes
  .use(routes)
  
  // Global error handler
  .onError(({ error, set }) => {
    console.error('Error:', error);
    
    set.status = 500;
    return {
      success: false,
      message: 'Internal server error',
      error: ENV.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
    };
  })
  
  // Start server
  .listen(parseInt(ENV.PORT));

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 Multi-Uploader API is running!                           ║
║                                                                ║
║   📡 Server: http://localhost:${app.server?.port}                           ║
║   🗄️  Database: MongoDB Connected                             ║
║   🔴 Redis: Connected (BullMQ Worker Active)                  ║
║   🔧 Environment: ${ENV.NODE_ENV.padEnd(44)}║
║                                                                ║
║   📚 API Documentation: http://localhost:${app.server?.port}/                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

✅ Ready to accept requests!

🎯 Available Endpoints:
   • Health Check:    GET  /api/health
   • Auth:            POST /api/auth/register
   • Auth:            POST /api/auth/login
   • Auth:            POST /api/auth/verify-otp
   • User Profile:    GET  /api/user/profile
   • Video Upload:    POST /api/videos/upload
   • Video List:      GET  /api/videos
   • Video Quota:     GET  /api/videos/quota
   • Admin Stats:     GET  /api/admin/stats
   • Admin Users:     GET  /api/admin/users

📖 For full API documentation, visit: GET /
`);
