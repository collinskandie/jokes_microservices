const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const amqp = require("amqplib");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.static("public"));
app.use(bodyParser.json());

let jokeTypes = []; // Placeholder for joke types
let submittedJokes = []; // Placeholder for submitted jokes
//let submittedJokes = [];

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",

  database: "jokes_db",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    const channel = await connection.createChannel();
    // Assert queue
    await channel.assertQueue("submittedJokes", { durable: false });
    // Consume messages from the queue
    channel.consume("submittedJokes", (message) => {
      if (message !== null) {
        // Process the message (in this case, we'll just log it)
        const joke = message.content.toString();
        console.log("Received message:", joke);
        // Add the received joke to the submittedJokes array
        submittedJokes.push(JSON.parse(joke));
        console.log("Submitted jokes:", submittedJokes);
        // Acknowledge message
        channel.ack(message);
      }
    });
    console.log(
      "Connected to RabbitMQ and consuming messages from submittedJokes queue"
    );
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
}

// Call the function to connect to RabbitMQ and start consuming messages
connectRabbitMQ();

// Endpoint to return the current list of types
app.get("/type", (req, res) => {
  // Logic to retrieve joke types from MySQL database
  connection.query("SELECT DISTINCT type FROM jokes", (err, results) => {
    if (err) {
      console.error("Error querying joke types:", err);
      res.status(500).send("Failed to retrieve joke types");
      return;
    }
    // Extract the types from the query results and return as JSON response
    const types = results.map((row) => row.type);
    res.json(types);
  });
});

// Endpoint to read SUBMITTED_JOKES queue and return a joke
app.get("/mod", (req, res) => {
  if (submittedJokes.length === 0) {
    return res.status(404).json({ error: "No jokes available for moderation" });
  }
  // Retrieve the first joke for moderation
  const joke = submittedJokes.shift();
  res.status(200).json(joke);
});
app.post("/delete", (req, res) => {
  // Logic to delete the joke (optional)
  // Here you can handle any necessary cleanup or logging
  res.status(200).json({ message: "Joke deleted successfully" });
});

// Endpoint for approving a moderated joke
app.post("/approve", (req, res) => {
  // Logic to approve the joke (optional)
  // Here you can handle any necessary actions when a joke is approved
  res.status(200).json({ message: "Joke approved successfully" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Moderate component is running on port ${PORT}`);
});
