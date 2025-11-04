const Service = require('../models/Service');
const { getOrSetCache, deleteCache, deleteCachePattern } = require('../utils/cache');

// Get all services (with caching)
const getAllServices = async (req, res) => {
  try {
    const { category, active } = req.query;
    const cacheKey = `services:${category || 'all'}:${active || 'all'}`;

    const services = await getOrSetCache(
      cacheKey,
      async () => {
        const filter = {};
        if (category) filter.category = category;
        if (active !== undefined) filter.active = active === 'true';

        return await Service.find(filter).sort({ category: 1, name: 1 }).lean();
      },
      3600 // 1 hour
    );

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single service
const getServiceById = async (req, res) => {
  try {
    const service = await getOrSetCache(
      `service:${req.params.id}`,
      async () => {
        return await Service.findById(req.params.id).lean();
      },
      3600
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new service
const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);

    // Invalidate cache
    await deleteCachePattern('services:*');

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update service
const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    // Invalidate cache
    await deleteCache(`service:${req.params.id}`);
    await deleteCachePattern('services:*');

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete service
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    // Invalidate cache
    await deleteCache(`service:${req.params.id}`);
    await deleteCachePattern('services:*');

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

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
