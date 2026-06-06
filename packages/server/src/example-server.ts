import { createExampleServer } from '.';

async function main() {
  const server = createExampleServer();
  console.log('Example MCP server created with capabilities:');
  console.log(JSON.stringify(server.getCapabilities(), null, 2));
}

if (require.main === module) void main();
