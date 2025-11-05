const express = require('express');
const router = express.Router();
const {
  getOverview,
  getRevenueStats,
  getOrderStatsByStatus,
  getTopCustomers,
  getPopularServices,
  getRecentOrders
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// Dashboard routes (protected - staff and admin only)
router.use(authenticate);
router.use(authorize('staff', 'admin'));

router.get('/overview', getOverview);
router.get('/revenue', getRevenueStats);
router.get('/orders/by-status', getOrderStatsByStatus);
router.get('/customers/top', getTopCustomers);
router.get('/services/popular', getPopularServices);
router.get('/orders/recent', getRecentOrders);

module.exports = router;
