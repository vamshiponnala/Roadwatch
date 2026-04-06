exports.errorHandler = (err, req, res, next) => {
  console.error(err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? "Internal server error." : err.message });
};