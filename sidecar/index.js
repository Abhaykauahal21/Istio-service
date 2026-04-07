const express = require('express');
const httpProxy = require('http-proxy');
const CircuitBreaker = require('./src/circuitBreaker');
const ConfigFetcher = require('./src/configFetcher');

const app = express();
const proxy = httpProxy.createProxyServer({});
const PORT = process.env.PORT || 3000;
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown-service';
const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL || 'http://localhost:3000';
const APP_PORT = process.env.APP_PORT || 3001; // Port of the local service

const configFetcher = new ConfigFetcher(CONTROL_PLANE_URL);
const breakers = new Map();

// Helper to get or create breaker
const getBreaker = (targetService) => {
    if (!breakers.has(targetService)) {
        breakers.set(targetService, new CircuitBreaker(targetService));
    }
    return breakers.get(targetService);
};

// Middleware to log
app.use((req, res, next) => {
    console.log(`[SIDECAR-${SERVICE_NAME}] Request: ${req.method} ${req.url}`);
    next();
});

// Config Update Endpoint (Webhook Pattern)
// Defined before catch-all to ensure it's reachable
app.post('/config/update', (req, res) => {
    console.log(`[SIDECAR-${SERVICE_NAME}] Received config update push`);
    configFetcher.fetchConfig().then(() => {
        if (configFetcher.breakersConfig) {
            configFetcher.breakersConfig.forEach(bConf => {
                const b = breakers.get(bConf.serviceName);
                if (b) b.updateConfig(bConf);
                else getBreaker(bConf.serviceName).updateConfig(bConf); // pre-create if needed
            });
        }
        res.json({ status: 'updated' });
    });
});

// Proxy Endpoint
app.all('*', async (req, res) => {
    const pathParts = req.path.split('/'); // e.g. [, service-b, api, data]
    const potentialServiceName = pathParts[1];

    // CHECK EGRESS: Is the first part a known service?
    const targetUrl = configFetcher.getServiceUrl(potentialServiceName);

    if (targetUrl && potentialServiceName !== SERVICE_NAME) {
        // EGRESS TRAFFIC to another service
        console.log(`[SIDECAR-${SERVICE_NAME}] EGRESS to ${potentialServiceName} -> ${targetUrl}`);

        const breaker = getBreaker(potentialServiceName);
        const originalUrl = req.originalUrl.replace(`/${potentialServiceName}`, '') || '/';
        const fullTargetUrl = `${targetUrl}${originalUrl}`;

        try {
            const response = await breaker.execute(async () => {
                // Use axios for explicit control over request/response and exact error tracking
                const axiosConfig = {
                    method: req.method,
                    url: fullTargetUrl,
                    // If you had req.body parsed, pass it here. For GET, it's ignored.
                    validateStatus: function (status) {
                        return status >= 200 && status < 500; // Resolve only if < 500. 5xx will reject and trip breaker!
                    }
                };
                return require('axios')(axiosConfig);
            });
            
            res.status(response.status).send(response.data);
        } catch (err) {
            if (err.message && err.message.includes('OPEN')) {
                return res.status(503).json({ error: 'Circuit Breaker OPEN', service: potentialServiceName });
            }
            
            const status = err.response ? err.response.status : 502;
            const errorPayload = err.response && err.response.data ? err.response.data : { error: 'Bad Gateway', details: err.message };
            res.status(status).json(errorPayload);
        }
    } else {
        // INGRESS TRAFFIC (or Egress to unknown, assumed local)
        // Forward to local app
        console.log(`[SIDECAR-${SERVICE_NAME}] INGRESS/LOCAL to localhost:${APP_PORT}`);

        proxy.web(req, res, { target: `http://localhost:${APP_PORT}` }, (err) => {
            // console.error(`[SIDECAR-${SERVICE_NAME}] Local Proxy Error: ${err.message}`);
            // Don't crash on connection refused if app is starting
            if (!res.headersSent) res.status(502).json({ error: 'Local Service Unavailable' });
        });
    }
});

// Start
app.listen(PORT, async () => {
    // Determine the Sidecar's own URL (where other sidecars should send traffic)
    // In this demo, sidecar port is the entry point.
    const myUrl = `http://localhost:${PORT}`;

    console.log(`Sidecar for ${SERVICE_NAME} running on port ${PORT} (Proxies to :${APP_PORT})`);

    // 1. Register Self
    await configFetcher.registerService(SERVICE_NAME, myUrl);

    // 2. Initial Fetch
    await configFetcher.fetchConfig();
    if (configFetcher.breakersConfig) {
        configFetcher.breakersConfig.forEach(bConf => {
            getBreaker(bConf.serviceName).updateConfig(bConf);
        });
    }

    // Polling Backup (every 30s)
    setInterval(() => {
        configFetcher.fetchConfig().then(() => {
            if (configFetcher.breakersConfig) {
                configFetcher.breakersConfig.forEach(bConf => {
                    const b = breakers.get(bConf.serviceName);
                    if (b) b.updateConfig(bConf);
                });
            }
        });
    }, 30000);
});

// Event handling for proxy errors
proxy.on('error', (err, req, res) => {
    console.error(`[PROXY ERROR] ${err.message}`);
    if (res && !res.headersSent) {
        res.status(502).json({ error: 'Bad Gateway', details: err.message });
    }
});
    
