import type { AiConfig, AiParseResult, StructuredFlow } from '@/types/ai';

const SYSTEM_PROMPT = `你是一个专业的 BPMN 流程建模专家。你的任务是将用户的自然语言描述解析为结构化的 BPMN 流程定义 JSON。

规则：
1. 输出必须是严格的 JSON 格式，不要包含任何其他文字
2. 节点类型必须是以下之一：startEvent, endEvent, userTask, serviceTask, scriptTask, exclusiveGateway, parallelGateway, inclusiveGateway
3. 每个流程必须有且仅有 1 个 startEvent 和至少 1 个 endEvent
4. 条件分支使用 exclusiveGateway，条件信息放在 edges 的 condition 字段
5. 并行分支使用 parallelGateway
6. 节点 id 使用简洁的英文标识（如 n1, n2, gw1 等）
7. 标签使用用户原始语言（通常是中文）

输出格式：
{
  "processName": "流程名称",
  "nodes": [
    { "id": "n1", "type": "startEvent", "label": "开始" },
    { "id": "n2", "type": "userTask", "label": "节点标签" },
    { "id": "gw1", "type": "exclusiveGateway", "label": "" }
  ],
  "edges": [
    { "source": "n1", "target": "n2" },
    { "source": "gw1", "target": "n3", "condition": "条件表达式" },
    { "source": "gw1", "target": "n4", "condition": "条件表达式" }
  ]
}`;

const CONTEXT_PROMPT = `当前已有流程图信息（如果用户要求修改已有流程，请基于此进行增量修改）：
{existingFlow}

用户输入：
{userInput}`;

function buildUserPrompt(userInput: string, existingFlow?: string): string {
  return CONTEXT_PROMPT
    .replace('{existingFlow}', existingFlow || '（空，新建流程）')
    .replace('{userInput}', userInput);
}

async function callClaudeApi(config: AiConfig, userPrompt: string): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.anthropic.com';
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  if (!textBlock) throw new Error('Claude API 返回格式异常');
  return textBlock.text;
}

async function callOpenAiApi(config: AiConfig, userPrompt: string): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function extractJson(text: string): string {
  // 尝试从 markdown code block 中提取 JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // 尝试直接解析整个文本
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return trimmed;

  // 尝试找到第一个 { 和最后一个 }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return trimmed.substring(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function validateStructuredFlow(flow: unknown): StructuredFlow | null {
  if (!flow || typeof flow !== 'object') return null;

  const obj = flow as Record<string, unknown>;
  if (!Array.isArray(obj.nodes) || !Array.isArray(obj.edges)) return null;

  const validTypes = new Set([
    'startEvent', 'endEvent', 'userTask', 'serviceTask', 'scriptTask',
    'sendTask', 'receiveTask', 'exclusiveGateway', 'parallelGateway',
    'inclusiveGateway', 'subProcess',
  ]);

  for (const node of obj.nodes as Array<Record<string, unknown>>) {
    if (!node.id || !node.type || !validTypes.has(node.type as string)) {
      return null;
    }
  }

  for (const edge of obj.edges as Array<Record<string, unknown>>) {
    if (!edge.source || !edge.target) return null;
  }

  return {
    processName: (obj.processName as string) || 'Process',
    nodes: (obj.nodes as StructuredFlow['nodes']).map(n => ({
      id: n.id,
      type: n.type,
      label: n.label || '',
    })),
    edges: (obj.edges as StructuredFlow['edges']).map(e => ({
      source: e.source,
      target: e.target,
      condition: e.condition,
    })),
  };
}

export async function parseWithAi(
  config: AiConfig,
  userInput: string,
  existingFlow?: string,
): Promise<AiParseResult> {
  const userPrompt = buildUserPrompt(userInput, existingFlow);

  try {
    let rawResponse: string;

    if (config.provider === 'claude') {
      rawResponse = await callClaudeApi(config, userPrompt);
    } else {
      rawResponse = await callOpenAiApi(config, userPrompt);
    }

    const jsonStr = extractJson(rawResponse);

    try {
      const parsed = JSON.parse(jsonStr);
      const flow = validateStructuredFlow(parsed);

      if (!flow) {
        return {
          flow: null,
          rawResponse,
          error: 'AI 返回的 JSON 格式不符合 BPMN 流程规范',
        };
      }

      return { flow, rawResponse };
    } catch {
      return {
        flow: null,
        rawResponse,
        error: 'AI 返回的内容无法解析为 JSON',
      };
    }
  } catch (err) {
    return {
      flow: null,
      rawResponse: '',
      error: err instanceof Error ? err.message : '未知错误',
    };
  }
}
