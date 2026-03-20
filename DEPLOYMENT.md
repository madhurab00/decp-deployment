# Deployment Guide

This is the quickest practical deployment setup for the current project.

## Recommended stack

- Frontend: Vercel
- Backend services: Render
- MongoDB: MongoDB Atlas
- RabbitMQ: CloudAMQP

## Backend deployment on Render

This repository includes:

- [render.yaml](/d:/528_project/Department-Engagement-Career-Platform/render.yaml)

It provisions these backend services:

- `decp-user-service`
- `decp-content-service`
- `decp-notification-service`
- `decp-chat-service`

### How to use it

1. Push the repository to GitHub.
2. In Render, create a new Blueprint deployment.
3. Select this repository.
4. Render will read `render.yaml`.
5. Fill in the required secret environment variables manually.

## Required backend environment variables

Set these in Render for each service:

- `MONGO_URI`
- `RABBITMQ_URL`
- `JWT_SECRET`
- `CLIENT_URL`

Set these additionally for `user-service`:

- `JWT_EXPIRE`
- `JWT_REFRESH_EXPIRE_DAYS`

### Important

- `JWT_SECRET` must be exactly the same for:
  - `user-service`
  - `content-service`
  - `notification-service`
  - `chat-service`

- `CLIENT_URL` should be your deployed frontend URL, for example:

```env
CLIENT_URL=https://your-app.vercel.app
```

## Frontend deployment on Vercel

Deploy the `decp-web-app` folder as a Vercel project.

### Vercel environment variables

Set:

```env
VITE_API_AUTH_SERVICE=https://your-user-service.onrender.com/api/auth
VITE_API_USER_SERVICE=https://your-user-service.onrender.com/api/users
VITE_API_CONTENT_SERVICE=https://your-content-service.onrender.com
VITE_API_NOTIFICATION_SERVICE=https://your-notification-service.onrender.com
VITE_API_CHAT_SERVICE=https://your-chat-service.onrender.com
```

## Post-deploy checks

Check these health endpoints:

- `https://your-user-service.onrender.com/health`
- `https://your-content-service.onrender.com/health`
- `https://your-notification-service.onrender.com/health`
- `https://your-chat-service.onrender.com/health`

Then verify in the frontend:

1. Register or log in
2. Open feed
3. Create a post
4. Like and comment
5. Create a job as alumni/admin
6. Apply to a job as student
7. Open notifications
8. Open messages and send a chat
9. Update profile

## Current production caveat

The app still uses base64 image storage for profile/post media in the demo flow.
That is okay for a demo, but for a proper production deployment you should move uploads to object storage like:

- Cloudinary
- AWS S3
- Firebase Storage

Then store only file URLs in MongoDB.
