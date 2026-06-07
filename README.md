# node-mcp-dev-1

This workspace contains a minimal MCP (Model Context Protocol) implementation in Node.js + TypeScript with HTTP and WebSocket transport examples.

Quick start

1. Install dependencies and build the workspace:

```bash
pnpm install
pnpm build
```

If the automated build fails, manually build each package:

```bash
npx tsc -p packages/common/tsconfig.json
npx tsc -p packages/server/tsconfig.json
npx tsc -p packages/client/tsconfig.json
```

2. Run the HTTP server example (in one terminal):

```bash
pnpm start:server-http
```

3. In another terminal run the HTTP client example:

```bash
pnpm start:client-http
```

4. Or try the WebSocket example (start server then run client):

```bash
pnpm start:server-http
pnpm start:client-ws
```

Files of interest

- `packages/common/src/index.ts` — MCP types.
- `packages/server/src/index.ts` — Server class and example factory.
- `packages/server/src/transports/*` — HTTP and WebSocket transports.
- `packages/client/src/*` — Client and HTTP/WS transports + examples.
# node-mcp-dev-1