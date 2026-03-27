const axios = require('axios');

class ConfigFetcher {
    constructor(controlPlaneUrl) {
        this.controlPlaneUrl = controlPlaneUrl;
        this.routes = [];
        this.breakers = {};
    }

    async fetchConfig() {
        try {
            const [policiesRes, breakersRes, servicesRes] = await Promise.all([
                axios.get(`${this.controlPlaneUrl}/api/policies`),
                axios.get(`${this.controlPlaneUrl}/api/breaker`),
                axios.get(`${this.controlPlaneUrl}/api/registry`)
            ]);

            this.policies = policiesRes.data;
            this.breakersConfig = breakersRes.data;
            this.services = servicesRes.data;

            console.log(`[CONFIG] Fetched ${this.policies.length} policies, ${this.breakersConfig.length} breakers, ${this.services.length} services`);
            return {
                policies: this.policies,
                breakers: this.breakersConfig,
                services: this.services
            };
        } catch (err) {
            console.error(`[CONFIG] Failed to fetch config: ${err.message}`);
            return null;
        }
    }

    async registerService(serviceName, serviceUrl) {
        try {
            await axios.post(`${this.controlPlaneUrl}/api/registry/register`, {
                name: serviceName,
                url: serviceUrl,
                version: '1.0.0'
            });
            console.log(`[CONFIG] Registered ${serviceName} at ${serviceUrl}`);
        } catch (err) {
            console.error(`[CONFIG] Failed to register: ${err.message}`);
        }
    }

    getServiceUrl(serviceName) {
        const service = this.services.find(s => s.name === serviceName);
        return service ? service.url : null;
    }


    getPolicy(source, target) {
        return this.policies.find(p => p.sourceService === source && p.targetService === target);
    }
}

module.exports = ConfigFetcher;
