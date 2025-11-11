const errorHandler = (err, req, res, next) => {
  const statusCode = err.statuscode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    ...(err.errors && err.errors.length > 0 && { errors: err.errors })
  });
};

export default errorHandler;
