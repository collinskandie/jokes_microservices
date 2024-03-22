// Import required modules
const express = require("express");
const bodyParser = require("body-parser");

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());

// Placeholder for joke types
let jokeTypes = [];

// Endpoint for submitting jokes
app.post("/submit", (req, res) => {
  const { joke } = req.body;
  if (!joke) {
    return res.status(400).json({ error: "Joke is required" });
  }
  // Push the joke to RabbitMQ for further processing
  // Implement RabbitMQ logic here
  jokeTypes.push(joke);
  res.status(200).json({ message: "Joke submitted successfully" });
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
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                      },
                    },
                    required: ["error"],
                  },
                },
              },
            },
          },
        },
      },
      "/types": {
        get: {
          summary: "Retrieve joke types",
          responses: {
            200: {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/docs": {
        get: {
          summary: "OpenAPI documentation",
          responses: {
            200: {
              description: "OK",
              content: {
                "text/html": {
                  schema: {
                    type: "string",
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  //   app.get("/openapi.json", (req, res) => {
  //     res.status(200).json(openapiSpec);
  //   });

  res.status(200).send("OpenAPI documentation", openapiSpec);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
