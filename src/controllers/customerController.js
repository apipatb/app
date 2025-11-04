const Customer = require('../models/Customer');
const { getOrSetCache, deleteCache, deleteCachePattern } = require('../utils/cache');
const { parsePagination, parseSort, paginate } = require('../utils/pagination');
const response = require('../utils/response');

// Get all customers (with pagination, sorting, filtering)
const getAllCustomers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const sort = parseSort(req.query.sort);
    const { search } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Create cache key based on query params
    const cacheKey = `customers:${page}:${limit}:${JSON.stringify(sort)}:${search || 'all'}`;

    const result = await getOrSetCache(
      cacheKey,
      async () => {
        const query = Customer.find(filter);
        return await paginate(query, { page, limit, skip, sort });
      },
      600 // 10 minutes (shorter cache for paginated results)
    );

    return response.successWithPagination(res, result.data, result.pagination);
  } catch (error) {
    return response.serverError(res, error.message);
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
      return response.notFound(res, 'Customer not found');
    }

    return response.success(res, customer);
  } catch (error) {
    return response.serverError(res, error.message);
  }
};

// Create new customer
const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);

    // Invalidate cache
    await deleteCachePattern('customers:*');

    return response.created(res, customer, 'Customer created successfully');
  } catch (error) {
    return response.badRequest(res, error.message);
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
      return response.notFound(res, 'Customer not found');
    }

    // Invalidate cache
    await deleteCache(`customer:${req.params.id}`);
    await deleteCachePattern('customers:*');

    return response.success(res, customer, 'Customer updated successfully');
  } catch (error) {
    return response.badRequest(res, error.message);
  }
};

// Delete customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return response.notFound(res, 'Customer not found');
    }

    // Invalidate cache
    await deleteCache(`customer:${req.params.id}`);
    await deleteCachePattern('customers:*');

    return response.success(res, null, 'Customer deleted successfully');
  } catch (error) {
    return response.serverError(res, error.message);
  }
};

// Search customers by phone
const searchByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return response.notFound(res, 'Customer not found');
    }

    return response.success(res, customer);
  } catch (error) {
    return response.serverError(res, error.message);
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
