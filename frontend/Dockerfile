# ---------- Build stage ----------
FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Serve stage ----------
FROM nginx:1.29.4-alpine

# Built frontend
COPY --from=build /app/dist/ /usr/share/nginx/html

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# SSL certs
RUN mkdir -p /etc/nginx/ssl
COPY certs/trackflow.crt /etc/nginx/ssl/trackflow.crt
COPY certs/trackflow.key /etc/nginx/ssl/trackflow.key

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]