const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrdersInQueue
} = require('../controllers/orderController');
const validate = require('../middleware/validate');
const orderSchemas = require('../validators/orderValidator');
const { strictLimiter } = require('../middleware/rateLimiter');

router.route('/')
  .get(validate(orderSchemas.query, 'query'), getAllOrders)
  .post(strictLimiter, validate(orderSchemas.create), createOrder);

router.get('/number/:orderNumber', getOrderByNumber);
router.get('/queue/:status', getOrdersInQueue);

router.route('/:id')
  .get(getOrderById)
  .put(strictLimiter, validate(orderSchemas.update), updateOrder)
  .delete(strictLimiter, deleteOrder);

router.patch('/:id/status', strictLimiter, validate(orderSchemas.updateStatus), updateOrderStatus);

module.exports = router;
