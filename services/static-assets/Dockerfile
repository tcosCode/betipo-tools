# syntax=docker/dockerfile:1
FROM nginx:1.28.0-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY betipo/ /usr/share/nginx/html/betipo/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1
