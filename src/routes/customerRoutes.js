const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchByPhone
} = require('../controllers/customerController');
const validate = require('../middleware/validate');
const customerSchemas = require('../validators/customerValidator');
const { strictLimiter } = require('../middleware/rateLimiter');
const { authenticate, authorize } = require('../middleware/auth');

router.route('/')
  .get(authenticate, getAllCustomers)
  .post(authenticate, strictLimiter, validate(customerSchemas.create), createCustomer);

router.get('/search', authenticate, validate(customerSchemas.query, 'query'), searchByPhone);

router.route('/:id')
  .get(authenticate, getCustomerById)
  .put(authenticate, authorize('staff', 'admin'), strictLimiter, validate(customerSchemas.update), updateCustomer)
  .delete(authenticate, authorize('admin'), strictLimiter, deleteCustomer);

module.exports = router;
