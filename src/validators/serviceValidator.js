const Joi = require('joi');

// Service validation schemas
const serviceSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(100).trim(),
    description: Joi.string().trim().optional(),
    price: Joi.number().required().min(0),
    duration: Joi.number().required().min(0),
    category: Joi.string().required().valid('wash', 'dry', 'iron', 'wash-and-iron', 'dry-clean', 'special'),
    active: Joi.boolean().default(true)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100).trim().optional(),
    description: Joi.string().trim().optional(),
    price: Joi.number().min(0).optional(),
    duration: Joi.number().min(0).optional(),
    category: Joi.string().valid('wash', 'dry', 'iron', 'wash-and-iron', 'dry-clean', 'special').optional(),
    active: Joi.boolean().optional()
  }).min(1),

  query: Joi.object({
    category: Joi.string().valid('wash', 'dry', 'iron', 'wash-and-iron', 'dry-clean', 'special').optional(),
    active: Joi.string().valid('true', 'false').optional()
  })
};

module.exports = serviceSchemas;
