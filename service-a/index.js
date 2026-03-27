const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3001;
// Sidecar logic: To call Service B, we request http://localhost:SIDECAR_PORT/service-b/...
// We assume Sidecar is running on PORT + 1000 = 4001?
// Or we just use a known Sidecar URL.
const SIDECAR_URL = process.env.SIDECAR_URL || 'http://localhost:4001';

app.get('/', (req, res) => {
    res.send('Hello from Service A!');
});

app.get('/trace', async (req, res) => {
    try {
        console.log('[SERVICE A] Calling Service B via Sidecar...');
        const response = await axios.get(`${SIDECAR_URL}/service-b/all`);
        res.json({
            message: 'Service A successfully called Service B',
            data: response.data
        });
    } catch (err) {
        console.error(`[SERVICE A] Call failed: ${err.message}`);
        const status = err.response ? err.response.status : 500;
        const errMsg = err.response && err.response.data && err.response.data.error 
                     ? err.response.data.error 
                     : err.message;
                     
        res.status(status).json({
            error: errMsg,
            details: err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Service A running on port ${PORT}`);
});
