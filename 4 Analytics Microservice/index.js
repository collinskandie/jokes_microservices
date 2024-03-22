// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib");
const mongoose = require("mongoose");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/analytics_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define MongoDB schema and model
const logSchema = new mongoose.Schema({
  submittedJoke: String,
  moderatedJoke: String,
  changedField: Boolean,
  moderator: String,
  submittedAt: Date,
  moderatedAt: Date,
});

const Log = mongoose.model("Log", logSchema);

// Connect to RabbitMQ
async function consumeFromQueue() {
  const connection = await amqp.connect("amqp://rabbitmq");
  const channel = await connection.createChannel();
  await channel.assertQueue("LOGGED_JOKES_QUEUE");

  channel.consume("LOGGED_JOKES_QUEUE", (message) => {
    if (message !== null) {
      const logData = JSON.parse(message.content.toString());
      saveLogToMongo(logData);
      channel.ack(message);
    }
  });
}

// Function to save log data to MongoDB
async function saveLogToMongo(logData) {
  try {
    const log = new Log(logData);
    await log.save();
    console.log("Log data saved to MongoDB:", logData);
  } catch (error) {
    console.error("Error saving log data to MongoDB:", error);
  }
}

// Start consuming messages from RabbitMQ
consumeFromQueue().catch(console.error);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
