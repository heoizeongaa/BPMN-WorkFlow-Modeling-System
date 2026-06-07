/** AI 解析的结构化流程中间表示 */
export interface StructuredFlowNode {
  id: string;
  type: string;
  label: string;
}

export interface StructuredFlowEdge {
  source: string;
  target: string;
  condition?: string;
}

export interface StructuredFlow {
  processName: string;
  nodes: StructuredFlowNode[];
  edges: StructuredFlowEdge[];
}

/** AI 服务提供商 */
export type AiProvider = 'claude' | 'openai';

/** AI 配置 */
export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

/** AI 解析状态 */
export type AiParseStatus = 'idle' | 'parsing' | 'success' | 'error';

/** AI 对话消息 */
export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/** AI 解析结果 */
export interface AiParseResult {
  flow: StructuredFlow | null;
  rawResponse: string;
  error?: string;
}
