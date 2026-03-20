require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// --- 1. Security Middlewares ---
// Helmet helps secure Express apps by setting various HTTP headers.
app.use(helmet());

// CORS configuration (crucial to allow frontend to send cookies)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Adjust this to match your React/React Native URL
  credentials: true, // MUST be true to accept HTTP-Only cookies from the frontend
}));

// Parse cookies attached to the client request object
app.use(cookieParser());

// Request logging
app.use(morgan('combined'));

// --- 2. Rate Limiting ---
// General rate limiter applied to all requests
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(globalLimiter);

// Specific stricter rate limiter for Auth (Login/Register)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 login requests per hour
  message: 'Too many accounts created from this IP, please try again after an hour'
});
// Apply this later specifically to the auth proxy route if needed, or inside the User Service.

// --- 3. Proxy Routing ---
// We do NOT use express.json() here globally because proxy middleware needs raw streams!

// Setup proxy options
const proxyOptions = {
  changeOrigin: true, // Needed for virtual hosted sites
  // Hook into proxy events here to log or modify requests/responses
  onProxyReq: (proxyReq, req, res) => {
    // Extract token from cookie and attach to Authorization header for internal services
    if (req.cookies && req.cookies.accessToken) {
      proxyReq.setHeader('Authorization', `Bearer ${req.cookies.accessToken}`);
    }
    // Also, if you need to forward the refresh token cookie specifically or all cookies:
    // This is optional if your services aren't directly checking the auth cookie (except for user-service /refresh & /logout)
  }
};

// Route Requests to Microservices
// Mount directly on '/' to prevent Express from stripping the base path completely.
// We explicitly define custom filters for the proxy middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/users')) {
    return createProxyMiddleware({ 
        target: process.env.USER_SERVICE_URL, 
        ...proxyOptions,
        pathRewrite: undefined // Prevent any rewrites, just pass it exactly as it came in
    })(req, res, next);
  }
  next();
});

app.use('/api/content', createProxyMiddleware({ target: process.env.CONTENT_SERVICE_URL, ...proxyOptions }));
app.use('/api/notifications', createProxyMiddleware({ target: process.env.NOTIFICATION_SERVICE_URL, ...proxyOptions }));
app.use('/api/chat', createProxyMiddleware({ target: process.env.CHAT_SERVICE_URL, ...proxyOptions }));

// Health Check for Gateway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API Gateway is running' });
});

// Fallback Route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found on API Gateway' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on port ${PORT}`);
  console.log(`Routes configured for User, Content, Notification, and Chat services.`);
});
