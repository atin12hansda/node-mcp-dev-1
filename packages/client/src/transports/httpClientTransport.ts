import http from 'http';
import https from 'https';
import { URL } from 'url';
import type { MCPMessage } from '@mcp/common';

export class HttpClientTransport {
  constructor(private readonly baseUrl: string, private readonly defaultTimeoutMs = 5000) {}

  async handleMessage(msg: MCPMessage): Promise<unknown> {
    const url = new URL(this.baseUrl + '/mcp');
    const payload = JSON.stringify(msg);

    const isHttps = url.protocol === 'https:';

    return new Promise((resolve, reject) => {
      const opts: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: this.defaultTimeoutMs,
      };

      const req = (isHttps ? https.request : http.request)(opts, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(Buffer.from(c)));
        res.on('end', () => {
          try {
            const obj = JSON.parse(Buffer.concat(chunks).toString());
            if (obj && obj.ok) resolve(obj.result);
            else reject(new Error(obj?.error ?? 'Unknown HTTP transport error'));
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('HTTP transport timeout'));
      });
      req.write(payload);
      req.end();
    });
  }
}
