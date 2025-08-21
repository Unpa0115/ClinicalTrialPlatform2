import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

/**
 * Middleware to handle express-validator validation results
 */
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: ValidationError) => ({
      field: 'path' in error ? error.path : 'unknown',
      message: error.msg,
      value: 'value' in error ? error.value : undefined
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors
    });
  }

  next();
}

/**
 * Custom validation middleware for specific business rules
 */
export function validateBusinessRules() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add custom business rule validations here
    // For example, checking if dates are in valid ranges, etc.
    next();
  };
}

/**
 * Sanitize request data
 */
export function sanitizeRequest() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic sanitization - remove undefined values
    if (req.body && typeof req.body === 'object') {
      Object.keys(req.body).forEach(key => {
        if (req.body[key] === undefined) {
          delete req.body[key];
        }
        
        // Trim strings
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    
    next();
  };
}