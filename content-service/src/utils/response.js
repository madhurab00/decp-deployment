const sendSuccess = (res, statusCode, data, message) =>
  res.status(statusCode).json({
    success: true,
    data,
    message
  });

const createHttpError = (statusCode, message, errors) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (errors) {
    error.errors = errors;
  }
  return error;
};

module.exports = {
  sendSuccess,
  createHttpError
};
