const express = require('express');
const router = express.Router();
const axios = require('axios');

// Default seeded breakers
let breakers = [
    { serviceName: 'service-a', failureThreshold: 5, cooldownPeriod: 10000, requestTimeout: 5000 },
    { serviceName: 'service-b', failureThreshold: 3, cooldownPeriod: 10000, requestTimeout: 5000 }
];

router.get('/', (req, res) => {
    res.json(breakers);
});

router.get('/:serviceName', (req, res) => {
    const b = breakers.find(b => b.serviceName === req.params.serviceName);
    if (!b) return res.status(404).json({ error: "Not found" });
    res.json(b);
});

router.post('/', (req, res) => {
    const { serviceName, failureThreshold, cooldownPeriod, requestTimeout } = req.body;
    
    let b = breakers.find(b => b.serviceName === serviceName);
    if (b) {
        b.failureThreshold = failureThreshold || b.failureThreshold;
        b.cooldownPeriod = cooldownPeriod || b.cooldownPeriod;
        b.requestTimeout = requestTimeout || b.requestTimeout;
    } else {
        b = { serviceName, failureThreshold, cooldownPeriod, requestTimeout };
        breakers.push(b);
    }
    
    console.log(`[CIRCUIT_BREAKER] Updated config for ${serviceName}`);
    
    // OFFLINE MODE COMPATIBILITY: Directly notify known sidecars instead of relying on Watcher Change Streams
    const sidecarPorts = [4001, 4002];
    sidecarPorts.forEach(port => {
        axios.post(`http://localhost:${port}/config/update`, { triggeredBy: 'CircuitBreaker' })
            .catch(e => console.log(`[MOCK-WATCHER] Failed to notify port ${port}: ${e.message}`));
    });

    res.json({ message: 'Circuit breaker config created/updated', config: b });
});

module.exports = router;
