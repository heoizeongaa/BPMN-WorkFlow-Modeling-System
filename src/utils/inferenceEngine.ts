import { v4 as uuidv4 } from 'uuid';
import type { ParsedFlow, ParsedFlowNode, ParsedFlowEdge } from '@/types/bpmn';

function generateId(prefix: string): string {
  return `${prefix}_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
}

function isGatewayType(type: string): boolean {
  return type === 'exclusiveGateway' || type === 'parallelGateway' || type === 'inclusiveGateway';
}

export function applyInferenceRules(flow: ParsedFlow): ParsedFlow {
  let result = applyForkGatewayRule(flow);
  result = applyMergeGatewayRule(result);
  return result;
}

function applyForkGatewayRule(flow: ParsedFlow): ParsedFlow {
  const outgoingMap = new Map<string, ParsedFlowEdge[]>();

  for (const edge of flow.edges) {
    if (!outgoingMap.has(edge.sourceId)) {
      outgoingMap.set(edge.sourceId, []);
    }
    outgoingMap.get(edge.sourceId)!.push(edge);
  }

  const newNodes: ParsedFlowNode[] = [...flow.nodes];
  const newEdges: ParsedFlowEdge[] = [];
  const replacedEdges = new Set<string>();

  for (const [sourceId, outgoing] of outgoingMap) {
    if (outgoing.length <= 1) {
      newEdges.push(...outgoing);
      continue;
    }

    const sourceNode = flow.nodes.find(n => n.id === sourceId);
    if (!sourceNode) continue;
    if (isGatewayType(sourceNode.type)) continue;

    const gatewayNode: ParsedFlowNode = {
      id: generateId('gw_fork'),
      name: '',
      type: 'exclusiveGateway',
    };
    newNodes.push(gatewayNode);

    newEdges.push({ sourceId, targetId: gatewayNode.id });

    for (const edge of outgoing) {
      replacedEdges.add(`${edge.sourceId}->${edge.targetId}`);
      newEdges.push({
        sourceId: gatewayNode.id,
        targetId: edge.targetId,
      });
    }
  }

  const filteredEdges = flow.edges.filter(
    e => !replacedEdges.has(`${e.sourceId}->${e.targetId}`)
  );

  return {
    nodes: newNodes,
    edges: [...filteredEdges, ...newEdges],
  };
}

function applyMergeGatewayRule(flow: ParsedFlow): ParsedFlow {
  const incomingMap = new Map<string, ParsedFlowEdge[]>();

  for (const edge of flow.edges) {
    if (!incomingMap.has(edge.targetId)) {
      incomingMap.set(edge.targetId, []);
    }
    incomingMap.get(edge.targetId)!.push(edge);
  }

  const newNodes: ParsedFlowNode[] = [...flow.nodes];
  const newEdges: ParsedFlowEdge[] = [];
  const replacedEdges = new Set<string>();

  for (const [targetId, incoming] of incomingMap) {
    if (incoming.length <= 1) {
      newEdges.push(...incoming);
      continue;
    }

    const targetNode = flow.nodes.find(n => n.id === targetId);
    if (!targetNode) continue;
    if (isGatewayType(targetNode.type)) continue;

    const gatewayNode: ParsedFlowNode = {
      id: generateId('gw_merge'),
      name: '',
      type: 'exclusiveGateway',
    };
    newNodes.push(gatewayNode);

    for (const edge of incoming) {
      replacedEdges.add(`${edge.sourceId}->${edge.targetId}`);
      newEdges.push({
        sourceId: edge.sourceId,
        targetId: gatewayNode.id,
      });
    }

    newEdges.push({ sourceId: gatewayNode.id, targetId });
  }

  const filteredEdges = flow.edges.filter(
    e => !replacedEdges.has(`${e.sourceId}->${e.targetId}`)
  );

  return {
    nodes: newNodes,
    edges: [...filteredEdges, ...newEdges],
  };
}
