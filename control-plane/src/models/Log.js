const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    source: { type: String, required: true },
    target: { type: String, required: true },
    path: { type: String },
    method: { type: String },
    statusCode: { type: Number },
    duration: { type: Number }, // in ms
    status: { type: String, enum: ['SUCCESS', 'FAILURE', 'BREAKER_OPEN'] },
    message: { type: String }
});

module.exports = mongoose.model('Log', logSchema);
