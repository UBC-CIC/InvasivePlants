# Use a Node 16 base image
## For others
# FROM node:16-alpine

## For MAC M1
FROM --platform=linux/amd64 node:16-alpine  

# Copy front-end to /app
COPY frontend /app

# Set the working directory to /app inside the container
WORKDIR /app

# ==== BUILD =====
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
RUN npm install

# ==== RUN =======
# Expose the port on which the app will be running (3000 is the default that `serve` uses)
EXPOSE 3000

# Start the app
CMD [ "npm", "start" ]