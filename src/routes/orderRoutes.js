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
const { authenticate, authorize } = require('../middleware/auth');

router.route('/')
  .get(validate(orderSchemas.query, 'query'), getAllOrders)
  .post(authenticate, strictLimiter, validate(orderSchemas.create), createOrder);

router.get('/number/:orderNumber', getOrderByNumber);
router.get('/queue/:status', getOrdersInQueue);

router.route('/:id')
  .get(getOrderById)
  .put(authenticate, authorize('staff', 'admin'), strictLimiter, validate(orderSchemas.update), updateOrder)
  .delete(authenticate, authorize('admin'), strictLimiter, deleteOrder);

router.patch('/:id/status', authenticate, authorize('staff', 'admin'), strictLimiter, validate(orderSchemas.updateStatus), updateOrderStatus);

module.exports = router;
