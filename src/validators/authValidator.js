const Joi = require('joi');

// Auth validation schemas
const authSchemas = {
  register: Joi.object({
    name: Joi.string()
      .required()
      .min(2)
      .max(100)
      .trim()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must not exceed 100 characters'
      }),

    email: Joi.string()
      .required()
      .email()
      .lowercase()
      .trim()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email'
      }),

    password: Joi.string()
      .required()
      .min(6)
      .max(100)
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password must not exceed 100 characters'
      }),

    phone: Joi.string()
      .optional()
      .pattern(/^[0-9]{10}$/)
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .required()
      .email()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email'
      }),

    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'string.empty': 'Refresh token is required'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .optional(),

    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Phone number must be 10 digits'
      })
  }).min(1),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'string.empty': 'Current password is required'
      }),

    newPassword: Joi.string()
      .required()
      .min(6)
      .max(100)
      .messages({
        'string.empty': 'New password is required',
        'string.min': 'New password must be at least 6 characters',
        'string.max': 'New password must not exceed 100 characters'
      })
  })
};

module.exports = authSchemas;
