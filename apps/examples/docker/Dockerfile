FROM oven/bun:1.2-alpine
WORKDIR /app
COPY package.json ./
RUN bun install
COPY src ./src
EXPOSE 4000
CMD ["bun", "run", "src/server.ts"]
