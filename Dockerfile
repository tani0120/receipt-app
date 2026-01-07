# Build stage
FROM node:22-alpine as build-stage
WORKDIR /app
COPY package*.json ./
# Use npm install to handle lockfile
RUN npm install
COPY . .
# Run build
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Cloud Run expects port 8080
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
