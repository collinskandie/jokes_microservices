const express = require("express");
const mysql = require("mysql2");
const amqp = require("amqplib");

const app = express();
const PORT = process.env.PORT || 3000;

// Set up MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "jokes_db",
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// Set up RabbitMQ connection
let channel;
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");
  } catch (error) {
    console.error("Error connecting to RabbitMQ:", error);
  }
}

connectRabbitMQ();

// Define endpoints
app.get("/jokes", (req, res) => {
  // Logic to retrieve jokes from MySQL database
  // Return jokes as JSON response
  connection.query("SELECT * FROM jokes", (err, results) => {
    if (err) {
      console.error("Error querying jokes:", err);
      res.status(500).send("Failed to retrieve jokes");
      return;
    }
    res.json(results);
  });
});

app.get("/joke-types", (req, res) => {
  // Logic to retrieve joke types from RabbitMQ
  // Return joke types as JSON response
  channel.assertQueue("jokeTypes", { durable: false });
  channel.consume(
    "jokeTypes",
    (message) => {
      res.json(JSON.parse(message.content.toString()));
    },
    { noAck: true }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
