import { createExampleServer } from '.';
import { createHttpTransport } from './transports/httpTransport';
import { createWebSocketTransport } from './transports/wsTransport';

async function main() {
  const server = createExampleServer();
  createHttpTransport(server, 3000);
  createWebSocketTransport(server, 3001);
}

if (require.main === module) void main();
