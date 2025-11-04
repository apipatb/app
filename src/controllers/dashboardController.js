const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Service = require('../models/Service');
const { getOrSetCache } = require('../utils/cache');

/**
 * Get dashboard overview statistics
 */
const getOverview = async (req, res) => {
  try {
    const stats = await getOrSetCache(
      'dashboard:overview',
      async () => {
        const [
          totalOrders,
          totalCustomers,
          totalRevenue,
          pendingOrders,
          processingOrders,
          completedToday
        ] = await Promise.all([
          Order.countDocuments(),
          Customer.countDocuments(),
          Order.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]),
          Order.countDocuments({ status: 'pending' }),
          Order.countDocuments({ status: 'processing' }),
          Order.countDocuments({
            status: 'completed',
            completedDate: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          })
        ]);

        return {
          totalOrders,
          totalCustomers,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingOrders,
          processingOrders,
          completedToday
        };
      },
      300 // Cache for 5 minutes
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get revenue statistics by date range
 */
const getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const cacheKey = `dashboard:revenue:${startDate}:${endDate}:${groupBy}`;

    const stats = await getOrSetCache(
      cacheKey,
      async () => {
        const matchStage = {
          paymentStatus: 'paid',
          ...(startDate && endDate && {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          })
        };

        // Group by format based on groupBy parameter
        let dateFormat;
        switch (groupBy) {
          case 'month':
            dateFormat = '%Y-%m';
            break;
          case 'week':
            dateFormat = '%Y-W%V';
            break;
          case 'day':
          default:
            dateFormat = '%Y-%m-%d';
        }

        const revenue = await Order.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
              totalRevenue: { $sum: '$totalAmount' },
              orderCount: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        return revenue;
      },
      600 // Cache for 10 minutes
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get order statistics by status
 */
const getOrderStatsByStatus = async (req, res) => {
  try {
    const stats = await getOrSetCache(
      'dashboard:orders:by-status',
      async () => {
        const result = await Order.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' }
            }
          },
          { $sort: { count: -1 } }
        ]);

        return result;
      },
      300 // Cache for 5 minutes
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get top customers by total spent
 */
const getTopCustomers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const stats = await getOrSetCache(
      `dashboard:top-customers:${limit}`,
      async () => {
        const result = await Order.aggregate([
          { $match: { paymentStatus: 'paid' } },
          {
            $group: {
              _id: '$customer',
              totalSpent: { $sum: '$totalAmount' },
              orderCount: { $sum: 1 }
            }
          },
          { $sort: { totalSpent: -1 } },
          { $limit: parseInt(limit) },
          {
            $lookup: {
              from: 'customers',
              localField: '_id',
              foreignField: '_id',
              as: 'customerInfo'
            }
          },
          { $unwind: '$customerInfo' },
          {
            $project: {
              _id: 1,
              name: '$customerInfo.name',
              phone: '$customerInfo.phone',
              email: '$customerInfo.email',
              totalSpent: 1,
              orderCount: 1
            }
          }
        ]);

        return result;
      },
      600 // Cache for 10 minutes
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get popular services
 */
const getPopularServices = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const stats = await getOrSetCache(
      `dashboard:popular-services:${limit}`,
      async () => {
        const result = await Order.aggregate([
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.service',
              timesOrdered: { $sum: '$items.quantity' },
              totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
            }
          },
          { $sort: { timesOrdered: -1 } },
          { $limit: parseInt(limit) },
          {
            $lookup: {
              from: 'services',
              localField: '_id',
              foreignField: '_id',
              as: 'serviceInfo'
            }
          },
          { $unwind: '$serviceInfo' },
          {
            $project: {
              _id: 1,
              name: '$serviceInfo.name',
              category: '$serviceInfo.category',
              price: '$serviceInfo.price',
              timesOrdered: 1,
              totalRevenue: 1
            }
          }
        ]);

        return result;
      },
      600 // Cache for 10 minutes
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get recent orders
 */
const getRecentOrders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const orders = await Order.find()
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getOverview,
  getRevenueStats,
  getOrderStatsByStatus,
  getTopCustomers,
  getPopularServices,
  getRecentOrders
};
