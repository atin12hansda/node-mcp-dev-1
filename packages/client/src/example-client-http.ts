import { HttpClientTransport } from './transports/httpClientTransport';
import { Client } from '.';

async function main() {
  const transport = new HttpClientTransport('http://localhost:3000');
  const client = new Client(transport as any);

  console.log('Discovering via HTTP...');
  const caps = await client.discover();
  console.log(JSON.stringify(caps, null, 2));

  console.log('Calling calc tool via HTTP...');
  const calc = await client.callTool('calc', { expr: '1+2*3' });
  console.log('calc ->', calc);
}

if (require.main === module) void main();
