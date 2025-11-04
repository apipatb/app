const Joi = require('joi');

// Order validation schemas
const orderSchemas = {
  create: Joi.object({
    customer: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'Invalid customer ID format'
    }),
    items: Joi.array().items(
      Joi.object({
        service: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
          'string.pattern.base': 'Invalid service ID format'
        }),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required(),
        notes: Joi.string().optional()
      })
    ).min(1).required(),
    totalAmount: Joi.number().min(0).required(),
    status: Joi.string().valid('pending', 'processing', 'ready', 'completed', 'cancelled').default('pending'),
    paymentStatus: Joi.string().valid('unpaid', 'paid', 'refunded').default('unpaid'),
    pickupDate: Joi.date().optional(),
    notes: Joi.string().optional()
  }),

  update: Joi.object({
    items: Joi.array().items(
      Joi.object({
        service: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required(),
        notes: Joi.string().optional()
      })
    ).min(1).optional(),
    totalAmount: Joi.number().min(0).optional(),
    status: Joi.string().valid('pending', 'processing', 'ready', 'completed', 'cancelled').optional(),
    paymentStatus: Joi.string().valid('unpaid', 'paid', 'refunded').optional(),
    pickupDate: Joi.date().optional(),
    completedDate: Joi.date().optional(),
    notes: Joi.string().optional()
  }).min(1),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'ready', 'completed', 'cancelled').required()
  }),

  query: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'ready', 'completed', 'cancelled').optional(),
    customer: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    paymentStatus: Joi.string().valid('unpaid', 'paid', 'refunded').optional()
  })
};

module.exports = orderSchemas;
