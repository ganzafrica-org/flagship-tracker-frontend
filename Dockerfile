# Build the SPA (react-router with ssr:false -> static client build)
FROM node:22-alpine AS build-env
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm run build

# Serve the static client build with nginx (SPA fallback to index.html)
FROM nginx:alpine
COPY --from=build-env /app/build/client /usr/share/nginx/html
RUN printf 'server {\n\
  listen 3000;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
