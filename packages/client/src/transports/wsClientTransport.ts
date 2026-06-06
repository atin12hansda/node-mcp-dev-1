import WebSocket, { type RawData } from 'ws';
import type { MCPMessage } from '@mcp/common';

export class WsClientTransport {
  private ws: WebSocket;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  constructor(private readonly url: string) {
    this.ws = new WebSocket(url);
    this.ws.on('message', (data: RawData) => {
      try {
        const obj = JSON.parse(data.toString());
        if (!obj || !obj.id) return;
        const entry = this.pending.get(obj.id);
        if (!entry) return;
        this.pending.delete(obj.id);
        if (obj.ok) entry.resolve(obj.result);
        else entry.reject(new Error(obj.error));
      } catch (err) {
        // ignore
      }
    });

    this.ws.on('error', () => {});
  }

  handleMessage(msg: MCPMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.pending.set(msg.id, { resolve, reject });
      this.ws.send(JSON.stringify(msg), (err?: Error) => {
        if (err) {
          this.pending.delete(msg.id);
          reject(err);
        }
      });
    });
  }
}
