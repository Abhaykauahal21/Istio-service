require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const connectDB = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/registry', require('./src/routes/registry'));
app.use('/api/policies', require('./src/routes/policies'));
app.use('/api/breaker', require('./src/routes/circuitBreaker'));

// Status Route
app.get('/status', (req, res) => {
    res.json({ status: 'Control Plane Running' });
});

// Logs - Simplified for now
app.get('/api/logs', async (req, res) => {
    const Log = require('./src/models/Log');
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Control Plane Server running on port ${PORT}`);
});
