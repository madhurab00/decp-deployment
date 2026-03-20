const jwt = require('jsonwebtoken');

const unauthorized = (message = 'Unauthorized') => {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
};

const decodeJwtSegment = (segment) => {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    throw unauthorized('Invalid token format');
  }
};

const verifyHs256 = (token, secret) => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw unauthorized('Invalid token format');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const header = decodeJwtSegment(encodedHeader);
  const payload = decodeJwtSegment(encodedPayload);

  if (header.alg !== 'HS256') {
    throw unauthorized('Unsupported token algorithm');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  const actualSignature = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualSignature.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualSignature, expectedBuffer)
  ) {
    throw unauthorized('Invalid token signature');
  }

  if (payload.exp && Date.now() >= payload.exp * 1000) {
    throw unauthorized('Token expired');
  }

  return payload;
};

const requireAuth = (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw unauthorized();
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_user_service_key');
    } catch (err) {
      throw unauthorized('Invalid or expired token');
    }
    const userId = payload.userId || payload.id || payload.sub;

    if (!userId) {
      throw unauthorized('Token missing user identifier');
    }

    req.user = {
      id: userId,
      role: payload.role || 'student'
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth
};
