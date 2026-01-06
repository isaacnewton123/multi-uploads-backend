# Multi-Uploader Platform

A comprehensive content distribution platform that enables creators to upload and manage video content across multiple social media platforms simultaneously.

## 🚀 Features

- **Multi-Platform Support:** Upload videos to YouTube Shorts, TikTok, Instagram Reels, and Facebook Reels simultaneously
- **JWT Authentication:** Secure authentication with Email OTP verification
- **Subscription Tiers:** Basic, Premium, and Enterprise plans with different daily upload limits
- **Background Processing:** Asynchronous video processing using BullMQ and Redis
- **Quota Management:** Automatic daily quota tracking and reset
- **Metadata Mapping:** Platform-specific metadata optimization
- **Admin Dashboard:** Comprehensive admin APIs for user management and analytics

## 🛠️ Tech Stack

- **Runtime:** Bun v1.3.5
- **Framework:** ElysiaJS v1.4.21
- **Database:** MongoDB v7.0 with Mongoose ODM
- **Language:** TypeScript v5.9.3
- **Authentication:** JWT with Email OTP
- **Queue System:** BullMQ v5.66.4 with Redis v7.0
- **Email Service:** Nodemailer v7.0.12

## 📋 Prerequisites

- Bun v1.3.5 or higher
- MongoDB v7.0 or higher
- Redis v7.0 or higher
- Node.js v20+ (for some dependencies)

## 🔧 Installation

1. **Clone the repository:**
   ```bash
   cd /app/backend
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Ensure MongoDB is running:**
   ```bash
   mongod --bind_ip_all
   ```

5. **Ensure Redis is running:**
   ```bash
   redis-server --daemonize yes
   ```

6. **Start the application:**
   ```bash
   bun run start
   # or for development with watch mode
   bun run dev
   ```

## 📁 Project Structure

```
/app/backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # MongoDB connection
│   │   └── env.ts            # Environment configuration
│   ├── models/
│   │   ├── user.model.ts     # User schema
│   │   ├── video.model.ts    # Video schema
│   │   └── otp.model.ts      # OTP schema
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── video.controller.ts
│   │   └── admin.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   ├── upload.service.ts
│   │   ├── quota.service.ts
│   │   └── metadata.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── quota.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── video.routes.ts
│   │   ├── admin.routes.ts
│   │   └── index.ts
│   ├── workers/
│   │   └── video.worker.ts   # Background job processor
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   └── validation.util.ts
│   ├── types/
│   │   └── index.ts          # TypeScript types
│   └── index.ts              # Main application
├── uploads/                   # Video upload directory
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
├── test_routes.sh            # API testing script
└── API_DOCUMENTATION.md      # Complete API docs
```

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=8001
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/multi_uploader

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OTP Configuration
OTP_EXPIRY_MINUTES=10

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=Multi-Uploader <noreply@multiuploader.com>

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=524288000

# CORS Configuration
CORS_ORIGINS=*
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP
- `GET /api/auth/profile` - Get user profile

### Videos
- `POST /api/videos/upload` - Upload video
- `GET /api/videos` - Get all user videos
- `GET /api/videos/:id` - Get specific video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/quota` - Get upload quota info

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id/tier` - Update user tier
- `POST /api/admin/users/:id/suspend` - Suspend user
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/logs/uploads` - Get upload logs
- `GET /api/admin/health` - Admin health check

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🧪 Testing

Run the comprehensive route testing script:

```bash
cd /app/backend
./test_routes.sh
```

This will test all API endpoints and provide a detailed report.

## 📊 Subscription Tiers

### Basic Tier
- **Daily Uploads:** 3 videos
- **Features:** Basic metadata, custom thumbnails, standard support
- **Users:** Single user

### Premium Tier
- **Daily Uploads:** 5 videos
- **Features:** All basic + advanced settings, subtitles, scheduling, templates
- **Support:** Priority support

### Enterprise Tier
- **Daily Uploads:** Unlimited
- **Features:** All premium + custom workflows, deep analytics, API access
- **Support:** Dedicated support manager

## 🌐 Supported Platforms

1. **YouTube Shorts**
2. **TikTok**
3. **Facebook Reels**
4. **Instagram Reels**

Each platform has automatic metadata mapping and optimization.

## 🔄 Background Processing

The application uses BullMQ for background job processing:

1. Video uploaded → Saved to database (status: `pending`)
2. Job added to Redis queue
3. Worker processes upload to each platform
4. Status updated to `success` or `failed`
5. Results stored with platform-specific URLs

## 🐛 Debugging

### Check logs:
```bash
# Backend logs
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/backend.err.log

# MongoDB logs
tail -f /var/log/mongodb.out.log

# Redis logs
redis-cli monitor
```

### Check service status:
```bash
sudo supervisorctl status
```

### Restart services:
```bash
sudo supervisorctl restart backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is proprietary and confidential.

## 👥 Team

Developed by the Multi-Uploader Team

## 📧 Support

For issues or questions:
- Check API documentation
- Review logs for errors
- Contact development team

## 🎉 Acknowledgments

- ElysiaJS for the amazing framework
- Bun for the fast runtime
- MongoDB and Redis for reliable data storage

---

**Built with ❤️ using Bun + ElysiaJS + TypeScript**
