const connectDB = async () => {
    // OFFLINE MODE: MongoDB is disabled to prevent DNS errors during presentations.
    // The Control Plane now runs 100% in-memory and is lightning fast!
    console.log("Mock DB Connected (Offline Enterprise Mode)");
};

module.exports = connectDB;
