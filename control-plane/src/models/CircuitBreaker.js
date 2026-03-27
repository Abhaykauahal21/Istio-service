const mongoose = require('mongoose');

const circuitBreakerSchema = new mongoose.Schema({
    serviceName: { type: String, required: true, unique: true },
    failureThreshold: { type: Number, default: 3 }, // Failures before opening
    cooldownPeriod: { type: Number, default: 10000 }, // Time in ms to stay OPEN
    requestTimeout: { type: Number, default: 2000 }, // Timeout for requests
    state: { type: String, enum: ['CLOSED', 'OPEN', 'HALF_OPEN'], default: 'CLOSED' }
});

module.exports = mongoose.model('CircuitBreaker', circuitBreakerSchema);
