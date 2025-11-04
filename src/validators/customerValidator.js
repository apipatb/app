const Joi = require('joi');

// Customer validation schemas
const customerSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(100).trim(),
    phone: Joi.string().required().pattern(/^[0-9]{10}$/).messages({
      'string.pattern.base': 'Phone number must be 10 digits'
    }),
    email: Joi.string().email().trim().lowercase().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      zipCode: Joi.string().optional()
    }).optional(),
    loyaltyPoints: Joi.number().min(0).default(0),
    totalOrders: Joi.number().min(0).default(0)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).trim().optional(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
      'string.pattern.base': 'Phone number must be 10 digits'
    }),
    email: Joi.string().email().trim().lowercase().optional(),
    address: Joi.object({
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      zipCode: Joi.string().optional()
    }).optional(),
    loyaltyPoints: Joi.number().min(0).optional(),
    totalOrders: Joi.number().min(0).optional()
  }).min(1), // At least one field must be provided

  query: Joi.object({
    phone: Joi.string().pattern(/^[0-9]{10}$/).required()
  })
};

module.exports = customerSchemas;
