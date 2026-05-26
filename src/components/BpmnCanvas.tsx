import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBpmnStore } from '@/store/bpmnStore';
import { StartEventNode, EndEventNode, UserTaskNode, ExclusiveGatewayNode, ParallelGatewayNode } from '@/components/nodes';
import { BpmnEdge } from '@/components/edges';

const nodeTypes = {
  startEvent: StartEventNode,
  endEvent: EndEventNode,
  userTask: UserTaskNode,
  exclusiveGateway: ExclusiveGatewayNode,
  parallelGateway: ParallelGatewayNode,
};

const edgeTypes = {
  bpmnEdge: BpmnEdge,
};

const defaultEdgeOptions = {
  type: 'bpmnEdge' as const,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 14,
    height: 14,
    color: '#555',
  },
};

export function BpmnCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useBpmnStore();

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  const handleConnect = useCallback(
    (connection: Parameters<typeof onConnect>[0]) => {
      onConnect(connection);
    },
    [onConnect]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={proOptions}
        deleteKeyCode={['Backspace', 'Delete']}
        snapToGrid
        snapGrid={[10, 10]}
        minZoom={0.1}
        maxZoom={2}
      >
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#555" />
            </marker>
            <marker
              id="arrow-selected"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1890ff" />
            </marker>
            <marker
              id="arrow-reject"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff4d4f" />
            </marker>
          </defs>
        </svg>
        <Background color="#e8e8e8" gap={20} size={1} />
        <Controls
          position="bottom-right"
          style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 4 }}
        />
        <MiniMap
          position="bottom-left"
          style={{ background: '#fafafa', border: '1px solid #e8e8e8' }}
          nodeColor={(node) => {
            switch (node.type) {
              case 'startEvent': return '#52c41a';
              case 'endEvent': return '#ff4d4f';
              case 'exclusiveGateway': return '#faad14';
              case 'parallelGateway': return '#2f54eb';
              default: return '#1890ff';
            }
          }}
          maskColor="rgba(0,0,0,0.05)"
        />
      </ReactFlow>
    </div>
  );
}
