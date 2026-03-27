const mongoose = require('mongoose');

const routingPolicySchema = new mongoose.Schema({
    sourceService: { type: String, default: '*' }, // '*' means any service
    targetService: { type: String, required: true },
    weight: { type: Number, default: 100 }, // For canary releases (0-100)
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model('RoutingPolicy', routingPolicySchema);
