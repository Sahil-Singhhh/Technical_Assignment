const ApiError = require('../utils/ApiError');

/**
 * Middleware generator for validating request payload, query, or params with a Joi schema
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @param {'body' | 'query' | 'params'} [property='body'] - Request property to validate
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: property === 'body' || property === 'query',
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));

      return next(
        new ApiError(400, 'Validation failed', errorMessages)
      );
    }

    // Replace the request property with the validated and type-cast value
    req[property] = value;
    next();
  };
};

module.exports = validate;
