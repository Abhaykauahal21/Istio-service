const express = require('express');
const router = express.Router();

let policies = [
    { name: 'A-to-B-Route', sourceService: 'service-a', targetService: 'service-b', routeType: 'HTTP', weight: 100 }
];

router.get('/', (req, res) => {
    res.json(policies);
});

router.post('/', (req, res) => {
    res.json({ message: 'Routing policy created natively' });
});

module.exports = router;
