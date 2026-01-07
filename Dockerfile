# Build & Run stage (Single stage for simplicity to keep dependencies)
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build the frontend assets
RUN npm run build

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

# Use 'npm start' to run the Hono server (IP restrictions applied here)
CMD ["npm", "start"]
