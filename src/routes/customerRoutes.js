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

router.route('/')
  .get(getAllCustomers)
  .post(createCustomer);

router.get('/search', searchByPhone);

router.route('/:id')
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
