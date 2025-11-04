FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose port (Railway will use PORT env variable)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
