export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number.isInteger(error.statusCode ?? error.status)
    ? error.statusCode ?? error.status
    : 500;
  const safeStatus = status >= 400 && status < 600 ? status : 500;

  const errorName = error instanceof Error ? error.name : 'Error';
  if (safeStatus >= 500) {
    const stackFrames =
      error instanceof Error ? error.stack?.split('\n').slice(1).join('\n') : '';
    console.error(
      `Request failed (${req.method} ${req.originalUrl}, ${safeStatus}): ${errorName}`,
      stackFrames,
    );
  } else {
    console.warn(
      `Request rejected (${req.method} ${req.originalUrl}, ${safeStatus}): ${errorName}`,
    );
  }

  let message =
    safeStatus >= 500
      ? 'Internal server error.'
      : error instanceof Error
        ? error.message
        : 'Request failed.';
  if (error.type === 'entity.parse.failed') {
    message = 'Invalid JSON request body.';
  } else if (error.type === 'entity.too.large') {
    message = 'Request body is too large.';
  } else if (safeStatus === 404) {
    message = 'Route not found.';
  }

  const response = { error: message };
  if (Array.isArray(error.issues)) {
    response.details = error.issues;
  }

  return res.status(safeStatus).json(response);
}
