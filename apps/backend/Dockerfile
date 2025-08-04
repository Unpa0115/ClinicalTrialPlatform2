FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build shared package
RUN npm run build --workspace=packages/shared

EXPOSE 3001

CMD ["npm", "run", "dev:backend"]