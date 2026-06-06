import { MCPMessage, MCPTool, MCPResource, MCPPrompt, MCPCapabilities, MCPExecutionContext } from '@mcp/common';

/**
 * Simple in-process MCP Server implementation.
 *
 * Production-ready considerations implemented:
 * - strict TypeScript types
 * - per-call timeouts
 * - robust error handling
 */
export class Server {
  private tools = new Map<string, MCPTool>();
  private resources = new Map<string, MCPResource>();
  private prompts = new Map<string, MCPPrompt>();

  // register a tool
  registerTool(tool: MCPTool): void {
    if (this.tools.has(tool.name)) throw new Error(`Tool already registered: ${tool.name}`);
    this.tools.set(tool.name, tool);
  }

  // register a resource
  registerResource(resource: MCPResource): void {
    if (this.resources.has(resource.name)) throw new Error(`Resource already registered: ${resource.name}`);
    this.resources.set(resource.name, resource);
  }

  // register a prompt
  registerPrompt(prompt: MCPPrompt): void {
    if (this.prompts.has(prompt.name)) throw new Error(`Prompt already registered: ${prompt.name}`);
    this.prompts.set(prompt.name, prompt);
  }

  // Return capabilities for discovery
  getCapabilities(): MCPCapabilities {
    return {
      tools: Array.from(this.tools.values()).map((t) => ({ name: t.name, description: t.description })),
      resources: Array.from(this.resources.values()).map((r) => ({ name: r.name, description: r.description })),
      prompts: Array.from(this.prompts.values()).map((p) => ({ name: p.name, description: p.description })),
    };
  }

  // handle an incoming MCP message and dispatch to the correct implementation
  async handleMessage(msg: MCPMessage, meta?: Record<string, unknown>): Promise<unknown> {
    if (!msg || !msg.id) throw new Error('Invalid MCPMessage: missing id');

    const ctx: MCPExecutionContext = { messageId: msg.id, meta };

    // Discovery
    if (msg.type === 'discovery' || msg.target === '*') {
      return this.getCapabilities();
    }

    // Tools
    if (msg.type === 'tool') {
      const tool = this.tools.get(msg.target);
      if (!tool) throw new Error(`Tool not found: ${msg.target}`);
      return this.runWithTimeout(tool.execute(msg.payload, ctx), msg.timeoutMs ?? 5000);
    }

    // Resources
    if (msg.type === 'resource') {
      const res = this.resources.get(msg.target);
      if (!res) throw new Error(`Resource not found: ${msg.target}`);
      return this.runWithTimeout(res.perform(msg.payload, ctx), msg.timeoutMs ?? 5000);
    }

    // Prompts: returns template with optional interpolation (simple)
    if (msg.type === 'prompt') {
      const p = this.prompts.get(msg.target);
      if (!p) throw new Error(`Prompt not found: ${msg.target}`);
      // for security and simplicity we don't do heavy templating; just return template
      return p.template;
    }

    throw new Error(`Unsupported message type: ${msg.type}`);
  }

  // small helper that enforces a timeout for async operations
  private async runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`MCP call timed out after ${timeoutMs}ms`)), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

// Helper to create an example server with a small filesystem-like resource and a calculator tool
export function createExampleServer(): Server {
  const s = new Server();

  // Simple in-memory file system resource
  const fsResource = {
    name: 'fs',
    description: 'In-memory file system resource (read/write)',
    perform: async (payload: unknown) => {
      const p = payload as { action: string; path: string; data?: string };
      if (!p || !p.action || !p.path) throw new Error('fs.perform requires {action,path}');
      // naive static map for demo
      const store = (fsResource as any)._store ||= new Map<string, string>();
      if (p.action === 'read') {
        if (!store.has(p.path)) throw new Error(`ENOENT: ${p.path}`);
        return { data: store.get(p.path) };
      }
      if (p.action === 'write') {
        if (typeof p.data !== 'string') throw new Error('write requires data string');
        store.set(p.path, p.data);
        return { ok: true };
      }
      throw new Error(`Unsupported fs action: ${p.action}`);
    },
  } as MCPResource;

  // Calculator tool (safe, limited arithmetic)
  const calcTool: MCPTool = {
    name: 'calc',
    description: 'Evaluate a simple arithmetic expression using + - * / and parentheses',
    execute: async (payload: unknown) => {
      const body = payload as { expr: string } | string | undefined;
      const expr = typeof body === 'string' ? body : body?.expr;
      if (!expr || typeof expr !== 'string') throw new Error('calc requires an expression string');

      // validate: only digits, whitespace, operators, decimal points, and parentheses
      if (!/^[0-9+\-*/(). \t\n\r]+$/.test(expr)) throw new Error('Expression contains invalid characters');

      // evaluate safely by using Function but with strict validation above
      try {
        // eslint-disable-next-line no-new-func
        const fn = new Function(`return (${expr});`);
        const result = fn();
        if (typeof result !== 'number' || !isFinite(result)) throw new Error('Expression did not evaluate to a finite number');
        return { result };
      } catch (err) {
        throw new Error(`Failed to evaluate expression: ${(err as Error).message}`);
      }
    },
  };

  // Add a simple prompt
  const greetPrompt: MCPPrompt = {
    name: 'greet',
    description: 'A friendly greeting prompt',
    template: 'Hello! How can I help you today?'
  };

  s.registerResource(fsResource);
  s.registerTool(calcTool);
  s.registerPrompt(greetPrompt);

  return s;
}
