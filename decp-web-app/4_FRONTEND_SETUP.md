# DECP Web App - Frontend Setup & Running Guide

## 📋 Project Overview

This is the frontend for the **Department Engagement & Career Platform (DECP)**, a microservices-based social and career platform for department students, alumni, and faculty.

### Features Implemented
✅ **Authentication**: Login/Registration with 3 roles (Student, Alumni, Admin)  
✅ **Feed**: Post creation, likes, comments, media sharing  
✅ **Jobs**: Post jobs (Alumni/Admin), apply (Students), browse opportunities  
✅ **Messaging**: One-to-one chat between users  
✅ **Notifications**: Real-time notifications for likes, comments, job posts  
✅ **User Profile**: View and edit user profile  

### Tech Stack
- **Frontend Framework**: React 19
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **State Management**: React Context API
- **UI Pattern**: Facebook + LinkedIn inspired design

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 16+ installed
- **npm** or **yarn** package manager
- Backend services running (see backend setup below)

### Step 1: Install Dependencies

Navigate to the web app directory and install dependencies:

```bash
cd decp-web-app
npm install
```

### Step 2: Configure API Endpoints

The frontend is configured to connect to backend services on the following ports:
- **User Service**: `http://localhost:4001`
- **Content Service**: `http://localhost:4002`
- **Notification Service**: `http://localhost:4003`
- **Chat Service**: `http://localhost:4004`

If your backend services run on different ports, update the configuration in:
```
src/config/api.js
```

Edit the API_ENDPOINTS object accordingly.

### Step 3: Start the Development Server

```bash
npm run dev
```

The application will start at **http://localhost:5173** (Vite default)

You should see:
```
  VITE v7.3.1  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

---

## 🔐 Authentication Testing

### Demo Credentials

Use these credentials to test the application:

#### Student Account
- **Email**: `student@university.com`
- **Password**: `password`

#### Alumni Account
- **Email**: `alumni@university.com`
- **Password**: `password`

#### Admin Account
- **Email**: `admin@university.com`
- **Password**: `password`

> **Note**: These are demo credentials. In production, replace with real authentication from your backend.

---

## 📱 Features & User Flows

### 1. **Authentication**
- Navigate to `/login`
- Register a new account with role selection
- Login with existing credentials
- Token stored in `localStorage` automatically

### 2. **Feed** (Home Page `/`)
- View posts from all users
- Create new posts (all users)
- Like and comment on posts
- Upload images with posts

### 3. **Jobs** (`/jobs`)
- Browse all job postings
- **Alumni/Admin**: Post new job opportunities
- **Students**: Apply for jobs
- Filter by: All Jobs, Applied, My Posts

### 4. **Messages** (`/messages`)
- View all conversations
- One-to-one messaging
- Search conversations
- Real-time message exchange

### 5. **Notifications** (`/notifications`)
- View all notifications
- Filter by type: Likes, Comments, Jobs
- Mark as read individually or all
- Manage notification preferences
- Delete notifications

### 6. **Profile** (`/profile`)
- View user profile information
- Edit profile details
- View user stats (posts, followers, following)

---

## 🛠 Build & Production

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Linting

Check code quality:

```bash
npm run lint
```

---

## 📁 Project Structure

```
decp-web-app/
├── src/
│   ├── assets/                  # Static assets
│   ├── components/
│   │   ├── MainLayout.jsx       # Main app layout with sidebar
│   │   └── ProtectedRoute.jsx   # Route protection component
│   ├── config/
│   │   └── api.js              # API configuration & instances
│   ├── context/
│   │   └── AuthContext.jsx     # Authentication context
│   ├── pages/
│   │   ├── LoginPage.jsx       # Login/Register page
│   │   ├── HomePage.jsx        # Feed & posts
│   │   ├── JobsPage.jsx        # Job listings & creation
│   │   ├── MessagesPage.jsx    # Messaging interface
│   │   ├── NotificationsPage.jsx # Notifications
│   │   ├── CreatePostPage.jsx  # Create post page
│   │   └── ProfilePage.jsx     # User profile
│   ├── App.jsx                 # Main app component with routing
│   ├── App.css                 # Global styles
│   ├── index.css               # Tailwind CSS setup
│   └── main.jsx                # React entry point
├── index.html                  # HTML template
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── eslint.config.js            # ESLint configuration
└── README.md                   # This file
```

---

## 🔗 API Integration Points

The frontend makes API calls to the backend services. Here's where each service is used:

### User Service (Port 4001)
```javascript
// src/config/api.js
userApi.post('/api/auth/login', {...})
userApi.post('/api/auth/register', {...})
userApi.get('/api/users/:id', {...})
userApi.put('/api/users/:id', {...})
```

### Content Service (Port 4002)
```javascript
// HomePage, JobsPage
contentApi.get('/api/posts', {...})
contentApi.post('/api/posts', {...})
contentApi.post('/api/posts/:id/like', {...})
contentApi.post('/api/posts/:id/comment', {...})
contentApi.get('/api/jobs', {...})
contentApi.post('/api/jobs', {...})
contentApi.post('/api/jobs/:id/apply', {...})
```

### Chat Service (Port 4004)
```javascript
// MessagesPage
chatApi.get('/api/conversations', {...})
chatApi.get('/api/conversations/:id/messages', {...})
chatApi.post('/api/conversations/:id/messages', {...})
```

### Notification Service (Port 4003)
```javascript
// NotificationsPage
notificationApi.get('/api/notifications', {...})
notificationApi.post('/api/notifications/:id/read', {...})
notificationApi.delete('/api/notifications/:id', {...})
```

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend"
**Solution**: Ensure backend services are running on correct ports
```bash
# Check if services are running
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health
curl http://localhost:4004/health
```

### Issue: "CORS errors"
**Solution**: Backend must have CORS enabled. Check backend service files:
```javascript
app.use(cors()); // Should be in service middleware
```

### Issue: "Token not persisting"
**Solution**: Check browser localStorage in DevTools:
```javascript
// In console
localStorage.getItem('token')
localStorage.getItem('user')
```

### Issue: "Styling not working"
**Solution**: Ensure Tailwind CSS is compiled
```bash
npm run dev  # Vite automatically watches Tailwind
```

---

## 📝 Environment Variables (Optional)

Create a `.env` file for custom configuration:

```env
# .env
VITE_API_USER_SERVICE=http://localhost:4001
VITE_API_CONTENT_SERVICE=http://localhost:4002
VITE_API_NOTIFICATION_SERVICE=http://localhost:4003
VITE_API_CHAT_SERVICE=http://localhost:4004
```

Update `src/config/api.js` to use these:
```javascript
const API_ENDPOINTS = {
  USER_SERVICE: import.meta.env.VITE_API_USER_SERVICE || 'http://localhost:4001',
  // ... rest
};
```

---

## 🔄 Development Workflow

### Watch File Changes
```bash
npm run dev
```
Vite automatically hot-reloads on file changes.

### Check for Lint Errors
```bash
npm run lint
```

### Format Code (Optional)
If you want to use Prettier:
```bash
npm install --save-dev prettier
npx prettier --write src/
```

---

## 📦 Deploying to Production

### Build the App
```bash
npm run build
```

### Deploy Artifacts
The `dist/` folder contains all production files. Deploy to:
- **Vercel** (recommended)
- **Netlify**
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**

### Environment Configuration
Update API endpoints in `api.js` to point to production backend:
```javascript
const API_ENDPOINTS = {
  USER_SERVICE: 'https://api.yourproduction.com/user',
  CONTENT_SERVICE: 'https://api.yourproduction.com/content',
  // ... etc
};
```

---

## 🎨 UI/UX Customization

### Colors
Update Tailwind theme in `src/index.css`:
```css
@theme {
  --color-brand-600: #your-color-here;
}
```

### Fonts
Tailwind is configured with Inter font. Change in `src/index.css`.

### Icons
All icons use Lucide React. Browse available icons: https://lucide.dev

---

## 📞 Support & Questions

For issues or questions:
1. Check backend service logs
2. Review browser console for errors
3. Check Network tab in DevTools for API failures
4. Verify localStorage for auth tokens

---

## ✅ Testing Checklist

Before moving to production:

- [ ] Login with all 3 roles works
- [ ] Create posts and see them in feed
- [ ] Like and comment on posts
- [ ] Alumni/Admin can post jobs
- [ ] Students can apply for jobs
- [ ] Messaging works between users
- [ ] Notifications appear on actions
- [ ] Profile edit works
- [ ] Logout clears auth
- [ ] Navigation between pages smooth

---

## 📄 License & Credits

This frontend is part of the Department Engagement & Career Platform (DECP) project for CO528 - Software Architecture course.

**Developed by**: Enterprise Architect (Desktop/Frontend)  
**Date**: 2026

---

## 🚀 Next Steps

After getting the frontend running:

1. **Connect Backend**: Ensure backend services are fully implemented
2. **User Testing**: Test all features with real data
3. **Performance**: Optimize images and bundle size
4. **Security**: Review and implement security best practices
5. **Documentation**: Update with production deployment details

---

**Happy Coding! 🎉**
