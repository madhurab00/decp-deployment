# DECP Frontend - Backend Integration Guide

This document explains how the frontend integrates with the backend microservices and what endpoints need to be implemented.

---

## 📡 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DECP Web Frontend                         │
│                      (React + Vite on :5173)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼──────┐  ┌─────▼────────┐  ┌──────▼──────────┐
│  User Service │  │Content Service│  │Notification    │
│   Port 4001   │  │  Port 4002    │  │Service Port4003 │
└───────────────┘  └───────────────┘  └─────────────────┘
         │               │
         │               └─────────────────┐
         │                                 │
    ┌────▼─────────────────────────────────▼────┐
    │         Chat Service                      │
    │              Port 4004                    │
    └──────────────────────────────────────────┘
```

---

## 🔐 User Service (Port 4001)

### Base URL: `http://localhost:4001`

### Authentication Endpoints

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "hashedPassword",
  "role": "student|alumni|admin"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "_id": "userId",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "2026-03-07T..."
    }
  },
  "message": "Registration successful"
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "hashedPassword"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "_id": "userId",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "student"
    }
  },
  "message": "Login successful"
}
```

### User Profile Endpoints

#### 3. Get User Profile
```http
GET /api/users/:userId
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": {
    "_id": "userId",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "bio": "Computer Engineering student",
    "location": "Colombo, Sri Lanka",
    "createdAt": "2026-03-07T..."
  }
}
```

#### 4. Update User Profile
```http
PUT /api/users/:userId
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "fullName": "John Doe Updated",
  "bio": "Updated bio",
  "location": "New Location"
}

Response (200):
{
  "success": true,
  "data": {
    "_id": "userId",
    "fullName": "John Doe Updated",
    ...
  }
}
```

---

## 📝 Content Service (Port 4002)

### Base URL: `http://localhost:4002`

### Post Endpoints

#### 1. Get All Posts (Feed)
```http
GET /api/posts?page=1&limit=10
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "postId",
      "author": {
        "_id": "authorId",
        "fullName": "Alice Johnson",
        "role": "student"
      },
      "content": "Post content here",
      "images": ["imageUrl1", "imageUrl2"],
      "likes": 12,
      "comments": [
        {
          "_id": "commentId",
          "author": { "fullName": "Bob Smith" },
          "content": "Nice post!"
        }
      ],
      "createdAt": "2026-03-07T...",
      "updatedAt": "2026-03-07T..."
    }
  ]
}
```

#### 2. Create Post
```http
POST /api/posts
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "content": "This is my post content",
  "images": ["base64ImageString1", "base64ImageString2"]
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "newPostId",
    "author": { "_id": "userId", "fullName": "..." },
    "content": "This is my post content",
    "images": [...],
    "likes": 0,
    "comments": [],
    "createdAt": "2026-03-07T..."
  }
}
```

#### 3. Like a Post
```http
POST /api/posts/:postId/like
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": {
    "postId": "postId",
    "likeCount": 13,
    "liked": true
  }
}
```

#### 4. Unlike a Post
```http
DELETE /api/posts/:postId/like
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": {
    "postId": "postId",
    "likeCount": 12,
    "liked": false
  }
}
```

#### 5. Add Comment to Post
```http
POST /api/posts/:postId/comments
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "content": "Great post!"
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "commentId",
    "author": { "_id": "userId", "fullName": "..." },
    "content": "Great post!",
    "createdAt": "2026-03-07T..."
  }
}
```

### Job Endpoints

#### 6. Get All Jobs
```http
GET /api/jobs?page=1&limit=10&type=internship|full-time|part-time
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "jobId",
      "title": "Full-Stack Developer Internship",
      "company": "Tech Corp",
      "description": "Join our team...",
      "location": "New York, NY",
      "type": "internship",
      "salary": "$20-25/hr",
      "deadline": "2026-04-07T...",
      "postedBy": {
        "_id": "alumniId",
        "fullName": "John Alumni",
        "role": "alumni"
      },
      "applicants": 5,
      "createdAt": "2026-03-07T..."
    }
  ]
}
```

#### 7. Create Job Posting (Alumni/Admin only)
```http
POST /api/jobs
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "title": "Full-Stack Developer Internship",
  "company": "Tech Corp",
  "description": "Join our team...",
  "location": "New York, NY",
  "type": "internship",
  "salary": "$20-25/hr",
  "deadline": "2026-04-07"
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "newJobId",
    "title": "Full-Stack Developer Internship",
    ...
  }
}
```

#### 8. Apply for Job (Students only)
```http
POST /api/jobs/:jobId/apply
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "coverLetter": "I'm very interested in this position..."
}

Response (201):
{
  "success": true,
  "data": {
    "applicationId": "appId",
    "jobId": "jobId",
    "applicantId": "studentId",
    "status": "pending",
    "appliedAt": "2026-03-07T..."
  }
}
```

#### 9. Get Job Applications (For job poster)
```http
GET /api/jobs/:jobId/applications
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "applicationId",
      "applicant": { "_id": "studentId", "fullName": "..." },
      "coverLetter": "...",
      "status": "pending|accepted|rejected",
      "appliedAt": "2026-03-07T..."
    }
  ]
}
```

---

## 💬 Chat Service (Port 4004)

### Base URL: `http://localhost:4004`

### Conversation Endpoints

#### 1. Get All Conversations
```http
GET /api/conversations
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "conversationId",
      "participants": [
        { "_id": "user1Id", "fullName": "Alice Johnson" },
        { "_id": "user2Id", "fullName": "Bob Smith" }
      ],
      "lastMessage": "Hey, how are you?",
      "lastMessageTime": "2026-03-07T...",
      "unreadCount": 2,
      "createdAt": "2026-03-05T...",
      "updatedAt": "2026-03-07T..."
    }
  ]
}
```

#### 2. Create or Get Conversation
```http
POST /api/conversations
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "recipientId": "otherUserId"
}

Response (200/201):
{
  "success": true,
  "data": {
    "_id": "conversationId",
    "participants": [...],
    ...
  }
}
```

### Message Endpoints

#### 3. Get Conversation Messages
```http
GET /api/conversations/:conversationId/messages?page=1&limit=20
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "messageId",
      "sender": { "_id": "senderId", "fullName": "..." },
      "content": "Hello!",
      "createdAt": "2026-03-07T..."
    }
  ]
}
```

#### 4. Send Message
```http
POST /api/conversations/:conversationId/messages
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "content": "Hey! How are you?"
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "messageId",
    "conversationId": "conversationId",
    "sender": { "_id": "userId", "fullName": "..." },
    "content": "Hey! How are you?",
    "createdAt": "2026-03-07T..."
  }
}
```

#### 5. Mark Messages as Read
```http
PUT /api/conversations/:conversationId/messages/read
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "message": "Messages marked as read"
}
```

---

## 🔔 Notification Service (Port 4003)

### Base URL: `http://localhost:4003`

### Notification Endpoints

#### 1. Get All Notifications
```http
GET /api/notifications?page=1&limit=10
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "notificationId",
      "type": "like|comment|job|message|follow",
      "actor": { "_id": "userId", "fullName": "Alice Johnson" },
      "message": "liked your post",
      "targetType": "post|job|message",
      "targetId": "postId",
      "read": false,
      "createdAt": "2026-03-07T..."
    }
  ]
}
```

#### 2. Mark Notification as Read
```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "data": {
    "_id": "notificationId",
    "read": true
  }
}
```

#### 3. Mark All Notifications as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### 4. Delete Notification
```http
DELETE /api/notifications/:notificationId
Authorization: Bearer JWT_TOKEN

Response (200):
{
  "success": true,
  "message": "Notification deleted"
}
```

#### 5. Update Notification Preferences
```http
PUT /api/notifications/preferences
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "likesNotifications": true,
  "commentsNotifications": true,
  "jobNotifications": true,
  "messageNotifications": true
}

Response (200):
{
  "success": true,
  "data": {
    "likesNotifications": true,
    ...
  }
}
```

---

## 🔄 Event-Driven Notifications (RabbitMQ)

When certain actions occur, services publish events to RabbitMQ that trigger notifications:

### Events Published by Content Service
- `post.liked` → Notification Service creates notification
- `post.commented` → Notification Service creates notification
- `job.posted` → Notification Service creates notification
- `job.applied` → Notification Service creates notification

### Events Published by Chat Service
- `message.sent` → Notification Service creates notification

---

## 🛡️ Authorization Rules

### By Role

#### Student
- ✅ Can view feed, posts, jobs
- ✅ Can create posts
- ✅ Can like/comment posts
- ✅ Can apply for jobs
- ✅ Can message anyone
- ✅ Can view notifications

#### Alumni
- ✅ All student permissions
- ✅ Can post jobs
- ✅ Can view job applications
- ❌ Cannot post jobs (only alumni/admin)

#### Admin
- ✅ All alumni permissions
- ✅ Can moderate posts
- ✅ Can manage all jobs
- ✅ Can view analytics

---

## 📊 Standard Response Format

All API responses follow this format:

```javascript
{
  "success": true|false,
  "data": { /* response data */ },
  "message": "Human readable message",
  "errors": [ /* validation errors if any */ ]
}
```

---

## 🚫 Error Handling

Common error responses:

```javascript
// 401 Unauthorized (Invalid/missing token)
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}

// 403 Forbidden (Insufficient permissions)
{
  "success": false,
  "message": "You do not have permission to perform this action",
  "statusCode": 403
}

// 404 Not Found
{
  "success": false,
  "message": "Resource not found",
  "statusCode": 404
}

// 400 Bad Request (Validation errors)
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "statusCode": 400
}

// 500 Server Error
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

---

## 🔗 Frontend Implementation

The frontend uses Axios instances to communicate with these services:

```javascript
// src/config/api.js
import { userApi, contentApi, chatApi, notificationApi } from './config/api';

// Example: Login
const response = await userApi.post('/api/auth/login', {
  email,
  password
});

// Example: Create post
const response = await contentApi.post('/api/posts', {
  content,
  images
});

// Example: Send message
const response = await chatApi.post(
  `/api/conversations/${conversationId}/messages`,
  { content }
);
```

---

## 🧪 Testing with Mock Data

For frontend development without backend:

```javascript
// The frontend has mock data built-in
// Remove/replace in these files:
// - src/pages/HomePage.jsx
// - src/pages/JobsPage.jsx
// - src/pages/MessagesPage.jsx
// - src/pages/NotificationsPage.jsx
```

---

## 📝 Environment Variables

Configure environment-specific endpoints:

```env
# .env
VITE_API_USER_SERVICE=http://localhost:4001
VITE_API_CONTENT_SERVICE=http://localhost:4002
VITE_API_NOTIFICATION_SERVICE=http://localhost:4003
VITE_API_CHAT_SERVICE=http://localhost:4004
```

---

## 🔐 JWT Token Format

Tokens are JWT (JSON Web Tokens) containing:

```json
{
  "userId": "user123",
  "email": "user@example.com",
  "role": "student",
  "iat": 1646000000,
  "exp": 1646086400
}
```

**Token storage**: `localStorage.token`  
**Token usage**: `Authorization: Bearer {token}` in all requests

---

## ✅ Implementation Checklist

- [ ] User Service: Register/Login endpoints
- [ ] User Service: Profile endpoints
- [ ] Content Service: Posts CRUD
- [ ] Content Service: Likes/Comments
- [ ] Content Service: Jobs CRUD
- [ ] Content Service: Job applications
- [ ] Chat Service: Conversations
- [ ] Chat Service: Messages
- [ ] Notification Service: Notifications
- [ ] Notification Service: Preferences
- [ ] RabbitMQ: Event publishing
- [ ] Authentication: JWT validation
- [ ] Authorization: Role-based access
- [ ] CORS: Configured on all services
- [ ] Error handling: Consistent format

---

**Last Updated**: March 7, 2026  
**For**: Department Engagement & Career Platform (DECP)
