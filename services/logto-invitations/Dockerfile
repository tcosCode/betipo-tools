FROM node:22.12.0-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY services/logto-invitations/lib.mjs ./lib.mjs
COPY services/logto-invitations/server.mjs ./server.mjs

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.mjs"]
