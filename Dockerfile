# Build stage — VITE_* values are baked in at build time, so they arrive as args.
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_API_URL=http://localhost:5000/api
ARG VITE_APP_NAME=EchoVibe
ARG VITE_JWT_LOCAL_STORAGE_KEY=token
ARG VITE_ENABLE_GOOGLE_LOGIN=false
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_GOOGLE_ALLOWED_ORIGINS=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_JWT_LOCAL_STORAGE_KEY=$VITE_JWT_LOCAL_STORAGE_KEY \
    VITE_ENABLE_GOOGLE_LOGIN=$VITE_ENABLE_GOOGLE_LOGIN \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_GOOGLE_ALLOWED_ORIGINS=$VITE_GOOGLE_ALLOWED_ORIGINS

COPY . .
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173
