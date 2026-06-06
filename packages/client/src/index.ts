import { MCPMessage } from '@mcp/common';
import { Server } from '@mcp/server';

/**
 * Simple in-process MCP Client.
 * In production you would use a transport (HTTP, WebSocket, gRPC). This class focuses
 * on protocol semantics: discovery, invocation with timeouts and error handling.
 */
export class Client {
  constructor(private readonly transport: { handleMessage: (m: MCPMessage) => Promise<unknown> } | Server) {}

  // Discover server capabilities
  async discover(): Promise<unknown> {
    // If transport is a Server instance use getCapabilities, else send discovery message
    if (this.transport instanceof Server) {
      return this.transport.getCapabilities();
    }
    return this.transport.handleMessage({ id: cryptoRandomId(), type: 'discovery', target: '*' });
  }

  // Call a tool by name
  async callTool(name: string, payload: unknown, timeoutMs = 5000): Promise<unknown> {
    const msg: MCPMessage = { id: cryptoRandomId(), type: 'tool', target: name, payload, timeoutMs };
    return this.call(msg);
  }

  // Call a resource
  async callResource(name: string, payload: unknown, timeoutMs = 5000): Promise<unknown> {
    const msg: MCPMessage = { id: cryptoRandomId(), type: 'resource', target: name, payload, timeoutMs };
    return this.call(msg);
  }

  // Generic call
  private async call(msg: MCPMessage): Promise<unknown> {
    try {
      if (this.transport instanceof Server) return await this.transport.handleMessage(msg);
      return await this.transport.handleMessage(msg);
    } catch (err) {
      throw new Error(`MCP client call failed: ${(err as Error).message}`);
    }
  }
}

// small helper to create a pseudo-random id
function cryptoRandomId(): string {
  // try to use crypto if available
  try {
    return (require('crypto') as typeof import('crypto')).randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
