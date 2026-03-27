const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  version: { type: String, default: '1.0.0' },
  status: { type: String, enum: ['UP', 'DOWN'], default: 'UP' },
  lastHeartbeat: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
