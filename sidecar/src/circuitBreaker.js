const axios = require('axios');

class CircuitBreaker {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.failureThreshold = options.failureThreshold || 3;
        this.cooldownPeriod = options.cooldownPeriod || 10000;
        this.requestTimeout = options.requestTimeout || 2000;

        this.failures = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = Date.now();
    }

    updateConfig(config) {
        if (config.failureThreshold) this.failureThreshold = config.failureThreshold;
        if (config.cooldownPeriod) this.cooldownPeriod = config.cooldownPeriod;
        if (config.requestTimeout) this.requestTimeout = config.requestTimeout;
        console.log(`[CB-${this.serviceName}] Config updated: Threshold=${this.failureThreshold}, Cooldown=${this.cooldownPeriod}`);
    }

    async execute(requestFn) {
        if (this.state === 'OPEN') {
            if (Date.now() >= this.nextAttempt) {
                console.log(`[CB-${this.serviceName}] Cooldown expired. Switching to HALF_OPEN.`);
                this.state = 'HALF_OPEN';
            } else {
                throw new Error(`Circuit Breaker is OPEN for ${this.serviceName}`);
            }
        }

        try {
            const response = await requestFn();
            this.onSuccess();
            return response;
        } catch (err) {
            this.onFailure();
            throw err;
        }
    }

    onSuccess() {
        const oldState = this.state;
        if (this.state === 'HALF_OPEN') {
            console.log(`[CB-${this.serviceName}] Request success in HALF_OPEN. Switching to CLOSED.`);
            this.state = 'CLOSED';
            this.failures = 0;
            this.updateStatusOnCP();
        } else {
            this.failures = 0;
            if (oldState !== 'CLOSED') this.updateStatusOnCP();
        }
    }

    onFailure() {
        const oldState = this.state;
        this.failures++;
        console.log(`[CB-${this.serviceName}] Failure recorded. Count: ${this.failures}/${this.failureThreshold}`);

        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.cooldownPeriod;
            console.log(`[CB-${this.serviceName}] Threshold reached. Circuit OPEN. Cooldown until ${new Date(this.nextAttempt).toISOString()}`);
            this.updateStatusOnCP();
        } else if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.cooldownPeriod;
            console.log(`[CB-${this.serviceName}] Failure in HALF_OPEN. Re-opening circuit.`);
            this.updateStatusOnCP();
        }
    }

    async updateStatusOnCP() {
        try {
            // This is a bit of a hack for the demo: 
            // We tell the Control Plane that the TARGET service has a certain status.
            // In a real mesh, the sidecar would report its own state or the CP would probe.
            const cpUrl = process.env.CONTROL_PLANE_URL || 'http://localhost:5000';
            await axios.post(`${cpUrl}/api/registry/status`, {
                name: this.serviceName,
                status: this.state === 'CLOSED' ? 'UP' : this.state
            });
        } catch (err) {
            console.error(`[CB-${this.serviceName}] Failed to update status on Control Plane: ${err.message}`);
        }
    }
}

module.exports = CircuitBreaker;
