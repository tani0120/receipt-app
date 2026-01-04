
# Use official lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (only production if possible, but we need build tools for now)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port (Cloud Run sets PORT env var, defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Start command
CMD ["npm", "start"]
