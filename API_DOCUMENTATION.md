# Multi-Uploader API Documentation

## Overview
The Multi-Uploader is a content distribution platform that enables creators to upload and manage video content across multiple social media platforms simultaneously.

**Tech Stack:**
- Runtime: Bun
- Framework: ElysiaJS
- Database: MongoDB (Mongoose ODM)
- Language: TypeScript
- Authentication: JWT with Email OTP
- Queue System: BullMQ with Redis

**Base URL:** `http://localhost:8001`

---

## Table of Contents
1. [Authentication Routes](#authentication-routes)
2. [User Routes](#user-routes)
3. [Video Routes](#video-routes)
4. [Admin Routes](#admin-routes)
5. [Subscription Tiers](#subscription-tiers)
6. [Platform Support](#platform-support)

---

## Authentication Routes

### 1. Register User
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "phone": "+1234567890" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful. Please verify your email with the OTP sent."
  }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Example:**
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "phone": "+1234567890"
  }'
```

---

### 2. Login User
**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent to your email. Please verify to complete login."
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

---

### 3. Verify OTP
**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "phone": "+1234567890",
      "tier": "basic",
      "isEmailVerified": true
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

---

### 4. Resend OTP
**Endpoint:** `POST /api/auth/resend-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully to your email"
  }
}
```

---

### 5. Get Profile (Auth Route)
**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "phone": "+1234567890",
    "tier": "basic",
    "isEmailVerified": true,
    "dailyUploadCount": 2,
    "lastResetDate": "2026-01-05T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:8001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## User Routes
*All user routes require authentication*

### 1. Get User Profile
**Endpoint:** `GET /api/user/profile`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "tier": "basic",
    "dailyUploadCount": 2,
    "lastResetDate": "2026-01-05T00:00:00.000Z"
  }
}
```

---

## Video Routes
*All video routes require authentication*

### 1. Upload Video
**Endpoint:** `POST /api/videos/upload`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file`: Video file (required)
- `title`: Video title (required)
- `description`: Video description (required)
- `targetPlatforms`: JSON array of platforms (required)
- `tags`: JSON array of tags (optional)
- `hashtags`: JSON array of hashtags (optional)
- `category`: Video category (optional)
- `privacy`: Privacy setting (optional)

**Target Platforms:**
- `youtube_shorts`
- `tiktok`
- `instagram_reels`
- `facebook_reels`

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "video_id",
    "status": "pending",
    "message": "Video uploaded successfully and queued for processing"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8001/api/videos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/video.mp4" \
  -F "title=My Awesome Video" \
  -F "description=This is an amazing video" \
  -F 'targetPlatforms=["youtube_shorts","tiktok"]' \
  -F 'tags=["tutorial","coding"]' \
  -F 'hashtags=["viral","trending"]'
```

---

### 2. Get User Videos
**Endpoint:** `GET /api/videos`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "video_id",
      "userId": "user_id",
      "title": "My Awesome Video",
      "description": "This is an amazing video",
      "fileURL": "/uploads/video.mp4",
      "status": "success",
      "targetPlatforms": ["youtube_shorts", "tiktok"],
      "uploadResults": {
        "youtube_shorts": {
          "success": true,
          "platformVideoId": "yt_abc123",
          "url": "https://youtube.com/shorts/abc123"
        },
        "tiktok": {
          "success": true,
          "platformVideoId": "tt_xyz789",
          "url": "https://tiktok.com/@user/video/xyz789"
        }
      },
      "createdAt": "2026-01-05T17:00:00.000Z",
      "updatedAt": "2026-01-05T17:05:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Video
**Endpoint:** `GET /api/videos/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "video_id",
    "title": "My Awesome Video",
    "status": "success",
    "targetPlatforms": ["youtube_shorts"],
    "uploadResults": {...}
  }
}
```

---

### 4. Delete Video
**Endpoint:** `DELETE /api/videos/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Video deleted successfully"
  }
}
```

---

### 5. Get Upload Quota
**Endpoint:** `GET /api/videos/quota`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tier": "basic",
    "dailyLimit": 3,
    "used": 2,
    "remaining": 1
  }
}
```

---

## Admin Routes
*All admin routes require authentication*

### 1. Get All Users
**Endpoint:** `GET /api/admin/users?page=1&limit=50`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  }
}
```

---

### 2. Get User by ID
**Endpoint:** `GET /api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "stats": {
      "totalVideos": 25
    }
  }
}
```

---

### 3. Update User Tier
**Endpoint:** `PUT /api/admin/users/:id/tier`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "tier": "premium"
}
```

**Valid Tiers:** `basic`, `premium`, `enterprise`

**Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "User tier updated to premium"
}
```

---

### 4. Suspend User
**Endpoint:** `POST /api/admin/users/:id/suspend`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

---

### 5. Get System Statistics
**Endpoint:** `GET /api/admin/stats`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1000,
    "totalVideos": 5000,
    "usersByTier": [
      { "_id": "basic", "count": 800 },
      { "_id": "premium", "count": 150 },
      { "_id": "enterprise", "count": 50 }
    ],
    "videosByStatus": [
      { "_id": "success", "count": 4500 },
      { "_id": "pending", "count": 300 },
      { "_id": "failed", "count": 200 }
    ],
    "recentVideos": [...]
  }
}
```

---

### 6. Get Upload Logs
**Endpoint:** `GET /api/admin/logs/uploads?page=1&limit=50`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videos": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 500,
      "pages": 10
    }
  }
}
```

---

### 7. Admin Health Check
**Endpoint:** `GET /api/admin/health`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-05T17:00:00.000Z",
    "uptime": 12345.67,
    "memory": {...}
  }
}
```

---

## Subscription Tiers

### Basic Tier
- **Daily Upload Limit:** 3 videos
- **Features:**
  - Basic video metadata
  - Custom thumbnails
  - Standard support (AI & Live Chat)
- **Access:** Single user only

### Premium Tier
- **Daily Upload Limit:** 5 videos
- **Features:**
  - All Basic features
  - Advanced settings
  - Subtitles/Captions
  - Video Chapters
  - End Screens/Cards
  - Scheduled Uploads
  - Video Templates
- **Support:** Priority AI & Live Chat

### Enterprise Tier
- **Daily Upload Limit:** Unlimited
- **Features:**
  - All Premium features
  - Custom upload workflows
  - Deep Analytics/Insights
  - API access
  - Custom features development
- **Support:** Dedicated Support Manager

---

## Platform Support

The system supports automated distribution to:
1. **YouTube Shorts**
2. **TikTok**
3. **Facebook Reels**
4. **Instagram Reels**

Each platform has specific metadata mapping and requirements handled automatically by the system.

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (quota exceeded, insufficient permissions)
- `404` - Not found
- `500` - Internal server error

---

## Background Job Processing

Video uploads are processed asynchronously using BullMQ. After uploading:
1. Video is saved to database with `pending` status
2. Job is added to processing queue
3. Worker picks up the job
4. Video is uploaded to selected platforms
5. Status is updated to `success` or `failed`

---

## Notes

1. **OTP Expiry:** OTPs expire after 10 minutes
2. **JWT Expiry:** JWT tokens expire after 7 days
3. **Daily Quota Reset:** Upload quotas reset at midnight (UTC)
4. **File Size Limit:** Maximum 500MB per video
5. **Supported Formats:** MP4, MOV, AVI, etc.

---

## Testing

Run the comprehensive test script:
```bash
cd /app/backend
./test_routes.sh
```

This will test all routes and provide a detailed report.

---

## Environment Variables

Required environment variables (`.env` file):
```env
PORT=8001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/multi_uploader
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
OTP_EXPIRY_MINUTES=10
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
REDIS_HOST=localhost
REDIS_PORT=6379
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=524288000
CORS_ORIGINS=*
```

---

## Support

For issues or questions, contact the development team or refer to the project repository.
