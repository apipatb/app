const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
} = require('../controllers/serviceController');
const validate = require('../middleware/validate');
const serviceSchemas = require('../validators/serviceValidator');
const { strictLimiter } = require('../middleware/rateLimiter');

router.route('/')
  .get(validate(serviceSchemas.query, 'query'), getAllServices)
  .post(strictLimiter, validate(serviceSchemas.create), createService);

router.route('/:id')
  .get(getServiceById)
  .put(strictLimiter, validate(serviceSchemas.update), updateService)
  .delete(strictLimiter, deleteService);

module.exports = router;
