import type { StructuredFlow } from '@/types/ai';
import type { ParsedFlow, ParsedFlowNode, ParsedFlowEdge, BpmnNodeType } from '@/types/bpmn';

const VALID_BPMN_TYPES = new Set<BpmnNodeType>([
  'startEvent', 'endEvent', 'userTask', 'serviceTask', 'scriptTask',
  'sendTask', 'receiveTask', 'exclusiveGateway', 'parallelGateway',
  'inclusiveGateway', 'subProcess',
]);

function mapNodeType(type: string): BpmnNodeType {
  if (VALID_BPMN_TYPES.has(type as BpmnNodeType)) return type as BpmnNodeType;
  // 兜底映射
  const lower = type.toLowerCase();
  if (lower.includes('start')) return 'startEvent';
  if (lower.includes('end')) return 'endEvent';
  if (lower.includes('gateway') || lower.includes('排他')) return 'exclusiveGateway';
  if (lower.includes('parallel') || lower.includes('并行')) return 'parallelGateway';
  return 'userTask';
}

export function structuredFlowToParsedFlow(flow: StructuredFlow): ParsedFlow {
  const nodes: ParsedFlowNode[] = flow.nodes.map(n => ({
    id: n.id,
    name: n.label,
    type: mapNodeType(n.type),
  }));

  const edges: ParsedFlowEdge[] = flow.edges.map(e => ({
    sourceId: e.source,
    targetId: e.target,
  }));

  return { nodes, edges };
}

/**
 * 将 StructuredFlow 中的条件信息附加到转换后的 edges 上
 * 返回 { parsedFlow, conditionMap } 供 store 使用
 */
export function structuredFlowWithConditions(flow: StructuredFlow): {
  parsedFlow: ParsedFlow;
  conditionMap: Map<string, string>; // edgeKey -> condition
} {
  const parsedFlow = structuredFlowToParsedFlow(flow);
  const conditionMap = new Map<string, string>();

  for (const edge of flow.edges) {
    if (edge.condition) {
      conditionMap.set(`${edge.source}->${edge.target}`, edge.condition);
    }
  }

  return { parsedFlow, conditionMap };
}
