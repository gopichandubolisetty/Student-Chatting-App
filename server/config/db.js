const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Remove deprecated useNewUrlParser / useUnifiedTopology (no-ops in Mongoose 8+).
    // Pass tlsAllowInvalidHostnames: false explicitly — helps on Windows with OpenSSL 3
    // where Atlas TLS handshake fails with "ssl alert number 80".
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
