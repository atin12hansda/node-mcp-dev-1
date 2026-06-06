/**
 * Common MCP types shared between client and server.
 * These describe the minimal protocol for capability discovery and invocation.
 */

export type UUID = string;

// A single MCP message from client -> server or vice-versa.
export interface MCPMessage {
  id: UUID;
  // 'tool'|'resource'|'prompt'|'discovery'
  type: 'tool' | 'resource' | 'prompt' | 'discovery';
  // target name (tool/resource/prompt name) or '*' for discovery
  target: string;
  // arbitrary payload for the invocation
  payload?: unknown;
  // client-provided timeout for this request in milliseconds
  timeoutMs?: number;
}

// Context passed to tools/resources during execution.
export interface MCPExecutionContext {
  messageId: UUID;
  // optional metadata (like caller id, auth, etc.)
  meta?: Record<string, unknown>;
}

// A tool is a callable unit the server exposes.
export interface MCPTool {
  name: string;
  description?: string;
  // execute returns arbitrary JSON-serializable result
  execute: (payload: unknown, ctx: MCPExecutionContext) => Promise<unknown>;
}

// A resource represents stateful or capability object (e.g. file-system)
export interface MCPResource {
  name: string;
  description?: string;
  // perform arbitrary operations via payload (action-based)
  perform: (payload: unknown, ctx: MCPExecutionContext) => Promise<unknown>;
}

// A prompt is a template or predefined instruction the server exposes.
export interface MCPPrompt {
  name: string;
  description?: string;
  template: string;
}

// Summary of server capabilities used for discovery
export interface MCPCapabilities {
  tools: Array<{ name: string; description?: string }>;
  resources: Array<{ name: string; description?: string }>;
  prompts: Array<{ name: string; description?: string }>;
}
