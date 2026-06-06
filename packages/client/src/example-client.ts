import { Client } from '.';
import { createExampleServer } from '@mcp/server';

async function main() {
  // For this example we run client and server in-process. In production they would be separate.
  const server = createExampleServer();
  const client = new Client(server);

  console.log('Discovering server capabilities...');
  const caps = await client.discover();
  console.log(JSON.stringify(caps, null, 2));

  console.log('Writing file via fs resource...');
  await client.callResource('fs', { action: 'write', path: '/hello.txt', data: 'Hello from MCP!' });
  console.log('Reading file via fs resource...');
  const read = await client.callResource('fs', { action: 'read', path: '/hello.txt' });
  console.log('fs.read ->', read);

  console.log('Running calculator tool...');
  const calc = await client.callTool('calc', { expr: '(2+3)*4.5' });
  console.log('calc ->', calc);

  console.log('Requesting prompt template...');
  const prompt = await (server as any).handleMessage({ id: 'p1', type: 'prompt', target: 'greet' });
  console.log('prompt ->', prompt);
}

if (require.main === module) void main();
