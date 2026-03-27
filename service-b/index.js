const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3002;

app.get('/all', (req, res) => {
    // Simulate Random Failures (30% chance)
    if (Math.random() < 0.3) {
        console.log('[SERVICE B] Simulating Failure (500)');
        return res.status(500).json({ error: 'Service B Internal Server Error (Simulated)' });
    }

    res.json({
        id: 1,
        name: 'Item from Service B',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Service B running on port ${PORT}`);
});
