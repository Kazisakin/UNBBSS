"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    // Default error
    let error = { message: 'Internal Server Error' };
    let statusCode = 500;
    // Validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        error.message = 'Validation Error';
    }
    // JWT error
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        error.message = 'Invalid token';
    }
    res.status(statusCode).json({ error: error.message });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map