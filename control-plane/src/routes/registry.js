const express = require('express');
const router = express.Router();

let services = [];

// POST /register - Register a service instance
router.post('/register', (req, res) => {
    const { name, url, version } = req.body;
    try {
        let service = services.find(s => s.name === name);
        if (service) {
            service.url = url;
            service.version = version || 'v1.0.0';
            service.status = 'UP';
            service.lastHeartbeat = Date.now();
        } else {
            service = { name, url, version: version || 'v1.0.0', status: 'UP', lastHeartbeat: Date.now() };
            services.push(service);
        }
        console.log(`[REGISTRY] Registered service: ${name} at ${url}`);
        res.json({ message: 'Service registered successfully', service });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /services - List all services
router.get('/', (req, res) => {
    res.json(services);
});

// POST /heartbeat - Update service heartbeat
router.post('/heartbeat', (req, res) => {
    const { name } = req.body;
    let service = services.find(s => s.name === name);
    if (!service) return res.status(404).json({ error: "Service not found" });
    service.lastHeartbeat = Date.now();
    service.status = 'UP';
    res.json({ status: "ok" });
});

// POST /status - Update service status (for Circuit Breaker states)
router.post('/status', (req, res) => {
    const { name, status } = req.body;
    let service = services.find(s => s.name === name);
    if (!service) return res.status(404).json({ error: "Service not found" });
    service.status = status;
    console.log(`[REGISTRY] Service ${name} status updated to: ${status}`);
    res.json({ status: "ok", service });
});

module.exports = router;
