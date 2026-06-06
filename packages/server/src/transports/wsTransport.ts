import { WebSocketServer } from 'ws';
import { Server as MCPServer } from '..';
import type { MCPMessage } from '@mcp/common';

// Simple WebSocket transport: accepts JSON requests and replies with JSON responses.
// Request: MCPMessage
// Response: { id, ok: true, result } or { id, ok: false, error }
export function createWebSocketTransport(mcp: MCPServer, port = 3001): WebSocketServer {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws) => {
    ws.on('message', async (data) => {
      let msg: MCPMessage;
      try {
        msg = JSON.parse(data.toString());
      } catch (err) {
        ws.send(JSON.stringify({ ok: false, error: 'invalid json' }));
        return;
      }

      if (!msg || !msg.id) {
        ws.send(JSON.stringify({ ok: false, error: 'missing id' }));
        return;
      }

      try {
        const result = await mcp.handleMessage(msg);
        ws.send(JSON.stringify({ id: msg.id, ok: true, result }));
      } catch (err) {
        ws.send(JSON.stringify({ id: msg.id, ok: false, error: (err as Error).message }));
      }
    });
  });

  // eslint-disable-next-line no-console
  console.log(`MCP WebSocket transport listening on ws://localhost:${port}`);

  return wss;
}
