const mongoose = require("mongoose");
const URI = process.env.MONGODB_URI;

// Validate URI
if (!URI) {
  console.error("MONGODB_DATABASE_URI environment variable is not set.");
  process.exit(1);
}

// Config
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(URI, { autoIndex: true });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`❌ Error while connect to mongoDB \n ${error.message}`);
    process.exit(1);
  }
};

// Export
module.exports = connectDB;
