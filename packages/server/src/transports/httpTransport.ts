import express from 'express';
import type { Server as HTTPServer } from 'http';
import { Server as MCPServer } from '..';
import type { MCPMessage } from '@mcp/common';

// Starts an HTTP server exposing MCP endpoints:
// - POST /mcp  -> accepts MCPMessage JSON and returns { ok, result | error }
// - GET /capabilities -> returns MCPCapabilities
export function createHttpTransport(mcp: MCPServer, port = 3000): HTTPServer {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/mcp', async (req, res) => {
    const msg = req.body as MCPMessage;
    if (!msg || !msg.id) return res.status(400).json({ ok: false, error: 'Invalid MCPMessage' });
    try {
      const result = await mcp.handleMessage(msg);
      res.json({ ok: true, result });
    } catch (err) {
      res.json({ ok: false, error: (err as Error).message });
    }
  });

  app.get('/capabilities', (_req, res) => {
    res.json(mcp.getCapabilities());
  });

  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`MCP HTTP transport listening on http://localhost:${port}`);
  });

  return server;
}
