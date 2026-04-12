FROM nginx:1.27-alpine AS build

RUN apk add --no-cache brotli gzip

WORKDIR /build
COPY index.html llms.txt llms-full.txt robots.txt sitemap.xml thanks.html ./
COPY framer-runtime/ ./framer-runtime/
COPY cognis-cms/ ./cognis-cms/

RUN find . -type f \( \
      -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.mjs" \
      -o -name "*.svg" -o -name "*.txt" -o -name "*.xml" -o -name "*.json" \
    \) -exec sh -c 'brotli -k -q 11 "$1" 2>/dev/null || true; gzip -k -9 "$1" 2>/dev/null || true' _ {} \;

FROM nginx:1.27-alpine

RUN apk add --no-cache nginx-mod-http-brotli || true

COPY deploy/nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/www/cognis
COPY --from=build /build/ /var/www/cognis/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
