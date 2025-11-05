const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { deleteCache, deleteCachePattern, trackOrderStatus, getOrdersByStatus } = require('../utils/cache');
const { publishNewOrder, publishOrderStatusChange } = require('../utils/notifications');
const { emitOrderUpdate, emitDashboardUpdate } = require('../config/socket');

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { status, customer } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (customer) filter.customer = customer;

    const orders = await Order.find(filter)
      .populate('customer', 'name phone email')
      .populate('items.service', 'name price')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single order
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name phone email address')
      .populate('items.service', 'name price category duration')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get order by order number
const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
      .populate('customer', 'name phone email address')
      .populate('items.service', 'name price category duration')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // Update customer's total orders
    await Customer.findByIdAndUpdate(
      order.customer,
      { $inc: { totalOrders: 1, loyaltyPoints: Math.floor(order.totalAmount / 10) } }
    );

    // Track in Redis
    await trackOrderStatus(order._id.toString(), order.status);

    // Invalidate customer cache
    await deleteCache(`customer:${order.customer}`);
    await deleteCachePattern('customers:*');

    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'name phone email')
      .populate('items.service', 'name price');

    // Publish new order notification
    await publishNewOrder({
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: populatedOrder.customer.name,
      totalAmount: order.totalAmount
    });

    // Emit real-time update via Socket.io
    emitOrderUpdate(order.orderNumber, {
      type: 'order-created',
      status: order.status,
      totalAmount: order.totalAmount
    });

    emitDashboardUpdate({
      type: 'new-order',
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount
    });

    res.status(201).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Get old order to track status change
    const oldOrder = await Order.findById(req.params.id).populate('customer', 'name');
    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const oldStatus = oldOrder.status;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(status === 'completed' && { completedDate: new Date() })
      },
      { new: true, runValidators: true }
    );

    // Track status change in Redis
    await trackOrderStatus(order._id.toString(), status);

    // Publish status change notification
    await publishOrderStatusChange({
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: status,
      customer: oldOrder.customer.name
    });

    // Emit real-time update via Socket.io
    emitOrderUpdate(order.orderNumber, {
      type: 'status-changed',
      oldStatus,
      newStatus: status,
      completedDate: order.completedDate
    });

    emitDashboardUpdate({
      type: 'order-status-changed',
      orderNumber: order.orderNumber,
      oldStatus,
      newStatus: status
    });

    // Invalidate dashboard cache
    await deleteCachePattern('dashboard:*');

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customer', 'name phone email')
     .populate('items.service', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Track in Redis if status changed
    if (req.body.status) {
      await trackOrderStatus(order._id.toString(), req.body.status);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get orders by status from Redis queue
const getOrdersInQueue = async (req, res) => {
  try {
    const { status } = req.params;
    const orderIds = await getOrdersByStatus(status, 50);

    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('customer', 'name phone')
      .lean();

    res.json({
      success: true,
      count: orders.length,
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
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  createOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  getOrdersInQueue
};
