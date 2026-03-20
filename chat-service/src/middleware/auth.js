const jwt = require('jsonwebtoken');

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
};

const verifyToken = (token, secret) => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerPart, payloadPart, signaturePart] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  if (signaturePart !== expectedSignature) {
    throw new Error('Invalid token signature');
  }

  const payload = JSON.parse(decodeBase64Url(payloadPart));
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }

  return payload;
};

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        statusCode: 401,
      });
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_user_service_key');
    } catch (err) {
      throw new Error('Invalid or expired token');
    }

    req.user = {
      _id: payload.userId,
      userId: payload.userId,
      role: payload.role || 'student',
      fullName: payload.fullName || 'Unknown User',
      headline: payload.headline || '',
      profilePicUrl: payload.profilePicUrl || '',
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message === 'Invalid token signature' ? 'invalid token signature' : 'Unauthorized',
      statusCode: 401,
    });
  }
};

module.exports = { protect };
