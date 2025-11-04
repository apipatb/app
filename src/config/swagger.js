const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Laundry Management API',
      version: '2.1.0',
      description: 'A comprehensive laundry management system API with Redis and MongoDB integration',
      contact: {
        name: 'API Support',
        email: 'support@laundry-api.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://your-app.up.railway.app',
        description: 'Production server (Railway)'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Customers',
        description: 'Customer management'
      },
      {
        name: 'Services',
        description: 'Service management'
      },
      {
        name: 'Orders',
        description: 'Order management'
      },
      {
        name: 'Dashboard',
        description: 'Analytics and statistics'
      }
    ],
    components: {
      schemas: {
        Customer: {
          type: 'object',
          required: ['name', 'phone'],
          properties: {
            _id: {
              type: 'string',
              description: 'Customer ID',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              description: 'Customer name',
              example: 'สมชาย ใจดี'
            },
            phone: {
              type: 'string',
              description: 'Phone number (10 digits)',
              example: '0812345678'
            },
            email: {
              type: 'string',
              description: 'Email address',
              example: 'somchai@email.com'
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: '123 ถนนสุขุมวิท' },
                city: { type: 'string', example: 'กรุงเทพมหานคร' },
                zipCode: { type: 'string', example: '10110' }
              }
            },
            loyaltyPoints: {
              type: 'number',
              description: 'Loyalty points',
              example: 150
            },
            totalOrders: {
              type: 'number',
              description: 'Total number of orders',
              example: 5
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Service: {
          type: 'object',
          required: ['name', 'price', 'duration', 'category'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'ซักรีด'
            },
            description: {
              type: 'string',
              example: 'ซักและรีด บริการครบวงจร'
            },
            price: {
              type: 'number',
              example: 60
            },
            duration: {
              type: 'number',
              description: 'Duration in hours',
              example: 48
            },
            category: {
              type: 'string',
              enum: ['wash', 'dry', 'iron', 'wash-and-iron', 'dry-clean', 'special'],
              example: 'wash-and-iron'
            },
            active: {
              type: 'boolean',
              example: true
            }
          }
        },
        Order: {
          type: 'object',
          required: ['customer', 'items', 'totalAmount'],
          properties: {
            _id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            orderNumber: {
              type: 'string',
              example: 'ORD2501000001'
            },
            customer: {
              type: 'string',
              description: 'Customer ID',
              example: '507f1f77bcf86cd799439011'
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  service: { type: 'string' },
                  quantity: { type: 'number' },
                  price: { type: 'number' },
                  notes: { type: 'string' }
                }
              }
            },
            totalAmount: {
              type: 'number',
              example: 300
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'ready', 'completed', 'cancelled'],
              example: 'pending'
            },
            paymentStatus: {
              type: 'string',
              enum: ['unpaid', 'paid', 'refunded'],
              example: 'unpaid'
            },
            pickupDate: {
              type: 'string',
              format: 'date-time'
            },
            notes: {
              type: 'string'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            totalPages: { type: 'number', example: 8 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
            nextPage: { type: 'number', example: 2 },
            prevPage: { type: 'number', example: null }
          }
        }
      },
      parameters: {
        page: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number'
        },
        limit: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          description: 'Number of items per page'
        },
        sort: {
          in: 'query',
          name: 'sort',
          schema: { type: 'string' },
          description: 'Sort field (use - for descending)',
          example: '-createdAt'
        },
        search: {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Search keyword'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
