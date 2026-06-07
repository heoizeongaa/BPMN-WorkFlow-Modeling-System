import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from '@xyflow/react';
import type { BpmnNodeData, BpmnEdgeData } from '@/types/bpmn';

const NODE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  startEvent: { width: 40, height: 40 },
  endEvent: { width: 40, height: 40 },
  userTask: { width: 160, height: 60 },
  serviceTask: { width: 160, height: 60 },
  scriptTask: { width: 160, height: 60 },
  sendTask: { width: 160, height: 60 },
  receiveTask: { width: 160, height: 60 },
  exclusiveGateway: { width: 50, height: 50 },
  parallelGateway: { width: 50, height: 50 },
  inclusiveGateway: { width: 50, height: 50 },
  subProcess: { width: 200, height: 120 },
};

const elk = new ELK();

export async function layoutWithElk(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<BpmnEdgeData>[]
): Promise<{ nodes: Node<BpmnNodeData>[]; edges: Edge<BpmnEdgeData>[] }> {
  if (nodes.length === 0) return { nodes, edges };

  const elkNodes: ElkNode[] = nodes.map(node => {
    const dims = NODE_DIMENSIONS[node.data.type] || NODE_DIMENSIONS.userTask;
    return {
      id: node.id,
      width: dims.width,
      height: dims.height,
    };
  });

  const elkEdges: ElkExtendedEdge[] = edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.spacing.nodeNode': '40',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.layered.cycleBreaking.strategy': 'GREEDY',
      'elk.edgeRouting': 'POLYLINE',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.crossingMinimization.semiInteractive': 'true',
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const layoutedGraph = await elk.layout(graph);

  const layoutedNodes = nodes.map(node => {
    const elkNode = layoutedGraph.children?.find(n => n.id === node.id);
    if (!elkNode) return node;

    return {
      ...node,
      position: {
        x: elkNode.x ?? 0,
        y: elkNode.y ?? 0,
      },
      style: {
        ...node.style,
        width: elkNode.width,
        height: elkNode.height,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
