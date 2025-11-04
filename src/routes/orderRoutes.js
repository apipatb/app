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

router.route('/')
  .get(getAllOrders)
  .post(createOrder);

router.get('/number/:orderNumber', getOrderByNumber);
router.get('/queue/:status', getOrdersInQueue);

router.route('/:id')
  .get(getOrderById)
  .put(updateOrder)
  .delete(deleteOrder);

router.patch('/:id/status', updateOrderStatus);

module.exports = router;
