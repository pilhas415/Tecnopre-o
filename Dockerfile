FROM node:22-bookworm-slim
WORKDIR /app
COPY . .
ENV NODE_ENV=production PORT=8787 HOST=0.0.0.0
EXPOSE 8787
CMD ["node","backend/server.js"]
