# Stage 1: Use official nginx to serve static files
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static site files to nginx html directory
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Optional: copy any other assets or subdirectories
# COPY dist/ /usr/share/nginx/html/dist/

# Expose port 80
EXPOSE 80

# nginx runs automatically in the base image
CMD ["nginx", "-g", "daemon off;"]
