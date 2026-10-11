function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "SKU already exists"
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID"
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}

module.exports = { notFound, errorHandler };