import { v4 as uuidv4 } from 'uuid';
import type { Node, Edge } from '@xyflow/react';
import type { BpmnNodeData, BpmnEdgeData, ParsedFlow } from '@/types/bpmn';

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  startEvent: { width: 60, height: 60 },
  endEvent: { width: 60, height: 60 },
  userTask: { width: 160, height: 60 },
  serviceTask: { width: 160, height: 60 },
  scriptTask: { width: 160, height: 60 },
  sendTask: { width: 160, height: 60 },
  receiveTask: { width: 160, height: 60 },
  exclusiveGateway: { width: 60, height: 60 },
  parallelGateway: { width: 60, height: 60 },
  inclusiveGateway: { width: 60, height: 60 },
  subProcess: { width: 200, height: 120 },
};

export function parsedFlowToReactFlow(flow: ParsedFlow): {
  nodes: Node<BpmnNodeData>[];
  edges: Edge<BpmnEdgeData>[];
} {
  const nodes: Node<BpmnNodeData>[] = flow.nodes.map((node, index) => {
    const dims = NODE_DIMENSIONS[node.type] || NODE_DIMENSIONS.userTask;
    return {
      id: node.id,
      type: node.type,
      position: { x: index * 200, y: 0 },
      data: {
        label: node.name,
        type: node.type,
      },
      style: {
        width: dims.width,
        height: dims.height,
      },
    };
  });

  const edges: Edge<BpmnEdgeData>[] = flow.edges.map(edge => ({
    id: `edge_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
    source: edge.sourceId,
    target: edge.targetId,
    type: 'bpmnEdge',
    data: {},
  }));

  return { nodes, edges };
}
