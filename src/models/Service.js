const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in hours
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['wash', 'dry', 'iron', 'wash-and-iron', 'dry-clean', 'special'],
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for active services
serviceSchema.index({ active: 1, category: 1 });

module.exports = mongoose.model('Service', serviceSchema);
