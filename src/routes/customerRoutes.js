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

router.route('/')
  .get(getAllCustomers)
  .post(strictLimiter, validate(customerSchemas.create), createCustomer);

router.get('/search', validate(customerSchemas.query, 'query'), searchByPhone);

router.route('/:id')
  .get(getCustomerById)
  .put(strictLimiter, validate(customerSchemas.update), updateCustomer)
  .delete(strictLimiter, deleteCustomer);

module.exports = router;
