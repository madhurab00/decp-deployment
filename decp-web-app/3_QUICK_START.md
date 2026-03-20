# ⚡ QUICK START - Run DECP Frontend in 2 Minutes

## ✅ Prerequisites Checklist

- [ ] Node.js 16+ installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] You're in the project root directory

---

## 🚀 Step-by-Step Instructions

### Step 1: Navigate to Frontend Directory
```bash
cd decp-web-app
```

### Step 2: Install Dependencies (First Time Only)
```bash
npm install
```

⏳ **Wait**: This takes 1-2 minutes to download and install packages

### Step 3: Start Development Server
```bash
npm run dev
```

✅ **You'll see**:
```
  VITE v7.3.1  ready in 123 ms

  ➜  Local:   http://localhost:5173/
```

### Step 4: Open Your Browser
Navigate to: **http://localhost:5173**

You should see the DECP login page! 🎉

---

## 🔐 Login & Test

### Demo Credentials

Copy and use these in the login page:

| Role | Email | Password |
|------|-------|----------|
| 👨‍🎓 Student | `student@university.com` | `password` |
| 🎯 Alumni | `alumni@university.com` | `password` |
| ⚙️ Admin | `admin@university.com` | `password` |

---

## 🎯 Features to Try

After logging in, try these:

### 🏠 **Home Feed**
- Click "Post" button
- Type a message
- Click "Post" to share
- Like posts with ❤️ button
- Comment on posts

### 💼 **Jobs** (click "Jobs" in sidebar)
- Browse job opportunities
- If you're Alumni/Admin: Click "+ Post Job" to create
- If you're Student: Click "Apply Now" on jobs

### 💬 **Messages** (click "Messages")
- Select a conversation
- Type message and press Enter
- See message history

### 🔔 **Notifications** (click "Notifications")
- See all notifications
- Mark as read
- Delete notifications
- Change preferences

### 👤 **Profile** (click your avatar, select "View Profile")
- See your profile
- Click "Edit Profile" to update
- Update name, bio, location

---

## ⚠️ Common Issues & Fixes

### "Cannot connect to backend"

**The frontend works offline with mock data!**

To connect to real backend:
1. Ensure backend services running on ports: 4001, 4002, 4003, 4004
2. Edit `src/config/api.js` if using different ports

### "npm: command not found"

Install Node.js from: **https://nodejs.org/**

### "Port 5173 already in use"

```bash
# Kill existing process and try again
npm run dev -- --port 5174
```

### "Nothing appears in browser"

1. Check console: Press F12 → Console tab
2. Check for red error messages
3. Reload page: Ctrl+R (or Cmd+R on Mac)

---

## 🔄 Development Workflow

### Making Changes

1. Edit any file in `src/`
2. Save (Ctrl+S)
3. Browser auto-refreshes with your changes ✨

### Start/Stop Server

- **Start**: `npm run dev`
- **Stop**: Press Ctrl+C in terminal

### Create Production Build

```bash
npm run build
```

This creates an optimized `dist/` folder for deployment.

---

## 📂 File Locations

Want to modify something?

| Feature | File |
|---------|------|
| Login page | `src/pages/LoginPage.jsx` |
| Home feed | `src/pages/HomePage.jsx` |
| Jobs | `src/pages/JobsPage.jsx` |
| Messages | `src/pages/MessagesPage.jsx` |
| Notifications | `src/pages/NotificationsPage.jsx` |
| Sidebar | `src/components/MainLayout.jsx` |
| API settings | `src/config/api.js` |
| Styling | `src/index.css` |

---

## 🎨 Customization Examples

### Change API Port
File: `src/config/api.js`
```javascript
const API_ENDPOINTS = {
  USER_SERVICE: 'http://localhost:YOUR_PORT',  // Change this
  // ...
};
```

### Change App Name
File: `index.html`
```html
<title>Your Platform Name</title>
```

### Change Colors
File: `src/index.css`
```css
@theme {
  --color-brand-600: #FF6B6B;  /* Change brand color */
}
```

---

## 📊 Architecture at a Glance

```
Frontend (React)
    ↓
[Login] → Auth Token stored in localStorage
    ↓
[Home/Jobs/Messages] → API calls to backend services
    ↓
Backend Microservices (Node.js)
├── User Service (4001)
├── Content Service (4002)
├── Notification Service (4003)
└── Chat Service (4004)
    ↓
MongoDB (Database)
```

---

## ✨ Features Implemented

✅ **1. Authentication**
- Register with role selection
- Login with email/password
- JWT token management

✅ **2. Social Feed**
- Post creation with images
- Like/comment functionality
- Real-time engagement metrics

✅ **3. Job Marketplace**
- Post jobs (Alumni/Admin)
- Apply for jobs (Students)
- View applications

✅ **4. Messaging**
- One-to-one conversations
- Message history
- User search

✅ **5. Notifications**
- Real-time alerts
- Multiple notification types
- Preferences management

✅ **6. User Profiles**
- View any profile
- Edit your profile
- User statistics

---

## 🆘 Still Stuck?

### Check These Files for Help:
- **Setup Issues**: See [FRONTEND_SETUP.md](./decp-web-app/FRONTEND_SETUP.md)
- **Backend Integration**: See [FRONTEND_BACKEND_INTEGRATION.md](../FRONTEND_BACKEND_INTEGRATION.md)
- **Architecture Details**: See [FRONTEND_COMPLETE_GUIDE.md](../FRONTEND_COMPLETE_GUIDE.md)

### Check Browser Console:
1. Press **F12** on keyboard
2. Click "Console" tab
3. Look for red error messages
4. Copy error and search on Google/Stack Overflow

---

## ⏱️ Timeline

| Step | Time |
|------|------|
| Navigate to directory | 10 sec |
| npm install | 60 sec |
| npm run dev | 5 sec |
| Open browser | 5 sec |
| **Total** | **~90 seconds** ✨ |

---

## 🎉 Next Steps

After confirming frontend works:

1. **Connect Backend**: Set up backend services
2. **Test API**: Replace mock data with real calls
3. **User Testing**: Have team members test
4. **Deployment**: Deploy to production

---

## 📝 Commands Reference

```bash
# Navigate to directory
cd decp-web-app

# First time setup
npm install

# Start development (hot reload)
npm run dev

# Check for errors
npm run lint

# Create production build
npm run build

# Preview production build
npm run preview

# Stop server
Ctrl+C
```

---

## 🔗 Useful Links

- **React Docs**: https://react.dev
- **Vite Docs**: https://vite.dev
- **Tailwind Classes**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev
- **React Router**: https://reactrouter.com

---

## ❓ Quick FAQ

**Q: Can I use this without backend?**  
A: Yes! Mock data is built-in. Real API calls are optional.

**Q: How do I change demo credentials?**  
A: You can't - they're mocked. Change in backend auth service.

**Q: Where is my data saved?**  
A: Only in browser localStorage (auth token). Reset by clearing browser data.

**Q: Can I deploy this?**  
A: Yes! Run `npm run build` then deploy `dist/` folder.

**Q: How do I add more pages?**  
A: Create new file in `src/pages/`, add route in `App.jsx`.

---

## ✅ Success Indicators

You'll know it's working when you:

- [ ] See login page at http://localhost:5173
- [ ] Can log in with demo credentials
- [ ] See home feed with sample posts
- [ ] Can create new posts
- [ ] Can navigate between sections
- [ ] Changes auto-refresh (hot reload)

---

**You're all set! Start the app and enjoy building! 🚀**

```bash
cd decp-web-app && npm install && npm run dev
```

---
