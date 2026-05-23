# Use official nginx to serve static files
FROM nginx:alpine

# Remove default nginx config and static assets
RUN rm -rf /usr/share/nginx/html/* && rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config (listens on port 3333)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static site files
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY app.js /usr/share/nginx/html/

# Optional: copy any other assets or subdirectories
# COPY dist/ /usr/share/nginx/html/dist/

# Expose port 3333
EXPOSE 3333

# nginx runs automatically in the base image
CMD ["nginx", "-g", "daemon off;"]
