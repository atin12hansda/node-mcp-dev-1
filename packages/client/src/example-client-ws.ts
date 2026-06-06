import { WsClientTransport } from './transports/wsClientTransport';
import { Client } from '.';

async function main() {
  const transport = new WsClientTransport('ws://localhost:3001');
  const client = new Client(transport as any);

  // Wait a moment for WS to connect
  await new Promise((r) => setTimeout(r, 200));

  console.log('Discovering via WebSocket...');
  const caps = await client.discover();
  console.log(JSON.stringify(caps, null, 2));

  console.log('Calling calc tool via WebSocket...');
  const calc = await client.callTool('calc', { expr: '7*(6+1)' });
  console.log('calc ->', calc);
}

if (require.main === module) void main();
