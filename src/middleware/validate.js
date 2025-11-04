/**
 * Validation Middleware
 * Validates request body, query, or params against a Joi schema
 */

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Show all errors
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors
      });
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
};

module.exports = validate;
