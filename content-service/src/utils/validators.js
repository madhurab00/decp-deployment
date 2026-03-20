const { Types } = require('mongoose');
const { createHttpError } = require('./response');

const ensureObjectId = (value, field) => {
  if (!Types.ObjectId.isValid(value)) {
    throw createHttpError(400, 'Validation error', [
      { field, message: 'Invalid identifier' }
    ]);
  }
};

const requireNonEmptyString = (value, field, label = field) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createHttpError(400, 'Validation error', [
      { field, message: `${label} is required` }
    ]);
  }

  return value.trim();
};

const requireFutureDate = (value, field) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw createHttpError(400, 'Validation error', [
      { field, message: `${field} must be a future date` }
    ]);
  }

  return date;
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

const normalizeMedia = (media, allowedTypes) => {
  if (!Array.isArray(media)) {
    return [];
  }

  return media
    .filter((item) => item && typeof item.url === 'string' && item.url.trim())
    .map((item) => ({
      url: item.url.trim(),
      type: allowedTypes.includes(item.type) ? item.type : allowedTypes[0]
    }));
};

module.exports = {
  ensureObjectId,
  requireNonEmptyString,
  requireFutureDate,
  normalizeMedia,
  normalizeStringArray
};
