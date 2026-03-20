const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.message || 'Internal server error',
    statusCode
  };

  if (error.errors) {
    payload.errors = error.errors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  errorHandler
};
