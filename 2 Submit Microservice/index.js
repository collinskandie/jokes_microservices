// Import required modules
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
const amqp = require("amqplib");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.static("public"));
app.use(bodyParser.json());

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

let channel; // RabbitMQ channel

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

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Joke API",
      version: "1.0.0",
      description: "API for submitting and retrieving jokes",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local server",
      },
    ],
  },
  apis: ["./index.js"], // Path to the API routes file(s)
};

const specs = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @openapi
 * /submit:
 *   post:
 *     summary: Submit a joke
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jokeType:
 *                 type: string
 *               setup:
 *                 type: string
 *               punchline:
 *                 type: string
 *     responses:
 *       200:
 *         description: Joke submitted successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

app.post("/submit", async (req, res) => {
  const { jokeType, setup, punchline } = req.body;
  if (!jokeType || !setup || !punchline) {
    return res
      .status(400)
      .json({ error: "Joke type, setup, and punchline are required" });
  }

  try {
    // Publish the joke to RabbitMQ for further processing
    await channel.assertQueue("submittedJokes", { durable: false });
    await channel.sendToQueue(
      "submittedJokes",
      Buffer.from(JSON.stringify({ jokeType, setup, punchline }))
    );
    console.log("Joke submitted to RabbitMQ:", { jokeType, setup, punchline });

    res.status(200).json({ message: "Joke submitted successfully" });
  } catch (error) {
    console.error("Error submitting joke to RabbitMQ:", error);
    res.status(500).json({ error: "Failed to submit joke" });
  }
});

/**
 * @openapi
 * /types:
 *   get:
 *     summary: Retrieve joke types
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
app.get("/types", (req, res) => {
  // Logic to retrieve joke types from MySQL database
  connection.query("SELECT DISTINCT type FROM jokes", (err, results) => {
    if (err) {
      console.error("Error querying joke types:", err);
      // Read joke types from backup file if available
      const backupFilePath = path.join(__dirname, "backup", "jokeTypes.json");
      if (fs.existsSync(backupFilePath)) {
        const backupData = fs.readFileSync(backupFilePath, "utf8");
        const types = JSON.parse(backupData);
        return res.json(types);
      } else {
        return res.status(500).send("Failed to retrieve joke types");
      }
    }
    // Extract the types from the query results and return as JSON response
    const types = results.map((row) => row.type);
    // Save types to backup file
    const backupFilePath = path.join(__dirname, "backup", "jokeTypes.json");
    fs.writeFileSync(backupFilePath, JSON.stringify(types), "utf8");
    res.json(types);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
