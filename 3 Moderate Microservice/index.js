// Import required modules
const express = require("express");
const bodyParser = require("body-parser");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(bodyParser.json());

// Placeholder for joke types
let jokeTypes = [];

// Placeholder for submitted jokes
let submittedJokes = [];

// Endpoint for moderating jokes
app.get("/moderate", (req, res) => {
  // Logic to retrieve a joke for moderation
  //   const joke = submittedJokes.shift();
  if (submittedJokes.length === 0) {
    return res.status(404).json({ error: "No jokes available for moderation" });
  }
  const joke = submittedJokes.shift(); // Retrieve the first joke for moderation
  res.status(200).json(joke);
});

// Endpoint for retrieving joke types
app.get("/types", (req, res) => {
  res.status(200).json(jokeTypes);
});

// Endpoint for OpenAPI documentation
app.get("/docs", (req, res) => {
  // Implement OpenAPI documentation here
  const openapiSpec = {
    openapi: "3.0.0",
    info: {
      title: "Joke API",
      version: "1.0.0",
      description: "API for submitting and retrieving jokes",
    },
    paths: {
      "/submit": {
        post: {
          summary: "Submit a joke",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    joke: {
                      type: "string",
                    },
                  },
                  required: ["joke"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Joke submitted successfully",
            },
            400: {
              description: "Bad request",
            },
          },
        },
      },
      "/types": {
        get: {
          summary: "Get joke types",
          responses: {
            200: {
              description: "List of joke types",
            },
          },
        },
      },
      "/moderate": {
        get: {
          summary: "Moderate a joke",
          responses: {
            200: {
              description: "Joke retrieved for moderation",
            },
            404: {
              description: "No jokes available for moderation",
            },
          },
        },
      },
    },
  };
  res.status(200).send("OpenAPI documentation", openapiSpec);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
