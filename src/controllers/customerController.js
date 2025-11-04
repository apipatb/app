const Customer = require('../models/Customer');
const { getOrSetCache, deleteCache, deleteCachePattern } = require('../utils/cache');

// Get all customers (with caching)
const getAllCustomers = async (req, res) => {
  try {
    const customers = await getOrSetCache(
      'customers:all',
      async () => {
        return await Customer.find().sort({ createdAt: -1 }).lean();
      },
      1800 // 30 minutes
    );

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single customer by ID (with caching)
const getCustomerById = async (req, res) => {
  try {
    const customer = await getOrSetCache(
      `customer:${req.params.id}`,
      async () => {
        return await Customer.findById(req.params.id).lean();
      },
      3600 // 1 hour
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    // Invalidate cache
    await deleteCachePattern('customers:*');

    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Invalidate cache
    await deleteCache(`customer:${req.params.id}`);
    await deleteCachePattern('customers:*');

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Invalidate cache
    await deleteCache(`customer:${req.params.id}`);
    await deleteCachePattern('customers:*');

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

// Search customers by phone
const searchByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  searchByPhone
};
