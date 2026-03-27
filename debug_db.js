require('dotenv').config();
const mongoose = require('mongoose');

// Adjust URI to match what we put in package.json/start_all.bat
const MONGO_URI = 'mongodb+srv://control:2003@cluster0.vvuzah9.mongodb.net/minimesh?appName=Cluster0';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        const services = await mongoose.connection.db.collection('services').find().toArray();
        console.log('Services:', services);

        const breakers = await mongoose.connection.db.collection('circuitbreakers').find().toArray();
        console.log('Breakers:', breakers);

        const policies = await mongoose.connection.db.collection('routingpolicies').find().toArray();
        console.log('Policies:', policies);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
