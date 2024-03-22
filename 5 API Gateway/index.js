const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://mongo:27017/analytics_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schema for log data
const logSchema = new mongoose.Schema({
  submittedJoke: String,
  moderatedJoke: String,
  changedField: Boolean,
  moderator: String,
  receivedDate: Date,
  submittedDate: Date,
});

// Create model from schema
const Log = mongoose.model("Log", logSchema);

// Logic to store log data in MongoDB
async function storeLogData(logData) {
  const log = new Log(logData);
  await log.save();
}

// Usage example
storeLogData(logData);
