const express = require("express");
const mysql = require("mysql2");
const amqp = require("amqplib");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Set up MySQL connection
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
  createJokesTable(); // Call function to create table
});

// Function to create 'jokes' table if it does not exist
function createJokesTable() {
  connection.query(
    `CREATE TABLE IF NOT EXISTS jokes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      joke_text TEXT NOT NULL,
      type VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err, results) => {
      if (err) {
        console.error("Error creating jokes table:", err);
        return;
      }
      console.log("Jokes table created successfully");
    }
  );
}

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
// Endpoint to return the current list of joke types in the database
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

// Endpoint to return one or more jokes of a specific type from the database
app.get("/joke", (req, res) => {
  const { type, count } = req.query;

  // If 'type' and 'count' are provided, return 'count' jokes of type 'type'
  if (type && count) {
    // Logic to retrieve 'count' jokes of type 'type' from MySQL database
    const sql = "SELECT * FROM jokes WHERE type = ? ORDER BY RAND() LIMIT ?";
    connection.query(sql, [type, count], (err, results) => {
      if (err) {
        console.error("Error querying jokes:", err);
        res.status(500).send("Failed to retrieve jokes");
        return;
      }
      res.json(results);
    });
  }
  // If only 'type' is provided, return a single joke of that type
  else if (type) {
    // Logic to retrieve a single joke of type 'type' from MySQL database
    const sql = "SELECT * FROM jokes WHERE type = ? ORDER BY RAND() LIMIT 1";
    connection.query(sql, [type], (err, results) => {
      if (err) {
        console.error("Error querying jokes:", err);
        res.status(500).send("Failed to retrieve jokes");
        return;
      }
      res.json(results[0]); // Return the first (and only) result
    });
  }
  // If no query parameters are provided, return one joke of type 'any'
  else {
    // Logic to retrieve one joke of any type from MySQL database
    const sql = "SELECT * FROM jokes ORDER BY RAND() LIMIT 1";
    connection.query(sql, (err, results) => {
      if (err) {
        console.error("Error querying jokes:", err);
        res.status(500).send("Failed to retrieve jokes");
        return;
      }
      res.json(results[0]); // Return the first (and only) result
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
