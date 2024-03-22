# Use a Node.js base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 3003 (or the port your Node.js app listens on)
EXPOSE 3003

# Command to run the application
CMD ["node", "index.js"]
