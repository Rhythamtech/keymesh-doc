# Stage 1: Build the application
FROM node:23-alpine AS builder

# Set the working directory
WORKDIR /app

# Set NODE_ENV to production for the build process
ENV NODE_ENV=production

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install dependencies
# Using 'npm ci' ensures a clean, reproducible install from package-lock.json
# We include devDependencies because they are required for the Astro build
RUN npm ci --include=dev

# Copy the rest of the application source code
COPY . .

# Build the Astro static site
RUN npm run build

# Stage 2: Serve the static files using Nginx
FROM nginx:stable-alpine

# Copy the build output from the builder stage to the Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for the web server
EXPOSE 80

# Healthcheck to ensure the container is running correctly
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]