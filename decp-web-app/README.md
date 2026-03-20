# DECP Web App - Frontend

A modern, responsive web application for the Department Engagement & Career Platform built with React, Vite, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:5173**

### Build for Production

```bash
npm run build
npm run preview
```

## 📋 Features

✅ Authentication (Login/Register with role selection)  
✅ Social Feed (Posts, likes, comments)  
✅ Job Marketplace (Post & apply for jobs)  
✅ Direct Messaging (One-to-one chat)  
✅ Notifications (Real-time alerts)  
✅ User Profiles (View & edit)  

## 🔐 Demo Credentials

- **Student**: student@university.com / password
- **Alumni**: alumni@university.com / password
- **Admin**: admin@university.com / password

## 📁 Project Structure

```
src/
├── components/    # React components (Layout, Route guards)
├── context/       # Authentication context
├── config/        # API configuration
├── pages/         # Page components
├── App.jsx        # Main routing
└── main.jsx       # Entry point
```

## 🔗 API Configuration

Backend services must run on:
- User Service: `http://localhost:4001`
- Content Service: `http://localhost:4002`
- Notification Service: `http://localhost:4003`
- Chat Service: `http://localhost:4004`

Update endpoints in `src/config/api.js` if different.

## 📖 Full Setup Guide

See [FRONTEND_SETUP.md](./FRONTEND_SETUP.md) for detailed setup, troubleshooting, and deployment instructions.
