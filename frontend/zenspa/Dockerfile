FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .
COPY src/environments/environment.docker.ts src/environments/environment.ts
RUN npx -y @angular/cli@19 build

FROM nginx:alpine
COPY --from=build /app/dist/zenspa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
