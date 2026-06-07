import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useOnViewportChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '@/styles/tokens.css';
import '@/styles/nodes.css';
import { useBpmnStore } from '@/store/bpmnStore';
import { StartEventNode, EndEventNode, UserTaskNode, ExclusiveGatewayNode, ParallelGatewayNode } from '@/components/nodes';
import { BpmnEdge } from '@/components/edges';
import { useZoomAdjustedValues } from '@/hooks/useZoomAdjustedValues';

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
    color: 'var(--bpmn--edge--color)',
  },
};

const MINIMAP_HIDE_DELAY = 1000;

export function BpmnCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useBpmnStore();
  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  // 缩放自适应：CSS 变量注入
  const { containerRef, scheduleUpdate } = useZoomAdjustedValues();

  // 小地图显隐控制
  const [isMinimapVisible, setIsMinimapVisible] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isMinimapHoveredRef = useRef(false);

  const showMinimap = useCallback(() => {
    clearTimeout(hideTimeoutRef.current);
    setIsMinimapVisible(true);
  }, []);

  const scheduleHideMinimap = useCallback(() => {
    if (isMinimapHoveredRef.current) return;
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setIsMinimapVisible(false), MINIMAP_HIDE_DELAY);
  }, []);

  // 监听拖拽开始/结束
  const handlePaneScroll = useCallback(() => {
    showMinimap();
  }, [showMinimap]);

  const handleMoveEnd = useCallback(() => {
    scheduleUpdate(); // 更新缩放 CSS 变量
    scheduleHideMinimap();
  }, [scheduleUpdate, scheduleHideMinimap]);

  const handleMoveStart = useCallback(() => {
    showMinimap();
    scheduleUpdate();
  }, [showMinimap, scheduleUpdate]);

  // 缩放变化时实时更新 CSS 变量
  useOnViewportChange({
    onEnd: () => scheduleUpdate(),
  });

  useEffect(() => {
    return () => clearTimeout(hideTimeoutRef.current);
  }, []);

  const handleConnect = useCallback(
    (connection: Parameters<typeof onConnect>[0]) => {
      onConnect(connection);
    },
    [onConnect],
  );

  const handleMinimapMouseEnter = useCallback(() => {
    isMinimapHoveredRef.current = true;
    clearTimeout(hideTimeoutRef.current);
    setIsMinimapVisible(true);
  }, []);

  const handleMinimapMouseLeave = useCallback(() => {
    isMinimapHoveredRef.current = false;
    clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setIsMinimapVisible(false), MINIMAP_HIDE_DELAY);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%' }}
    >
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
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        onPaneScroll={handlePaneScroll}
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
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--bpmn--edge--color)" />
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
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--bpmn--edge--selected)" />
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
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--bpmn--edge--reject)" />
            </marker>
          </defs>
        </svg>
        <Background color="var(--canvas--dot--color)" gap={20} size={1} />
        <Controls position="bottom-right" />
        <div
          onMouseEnter={handleMinimapMouseEnter}
          onMouseLeave={handleMinimapMouseLeave}
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            opacity: isMinimapVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: isMinimapVisible ? 'auto' : 'none',
          }}
        >
          <MiniMap
            nodeColor={(node) => {
              switch (node.type) {
                case 'startEvent': return 'var(--bpmn--start--color)';
                case 'endEvent': return 'var(--bpmn--end--color)';
                case 'exclusiveGateway': return 'var(--bpmn--exclusive--color)';
                case 'parallelGateway': return 'var(--bpmn--parallel--color)';
                default: return 'var(--bpmn--task--color)';
              }
            }}
            maskColor="rgba(0,0,0,0.05)"
          />
        </div>
      </ReactFlow>
    </div>
  );
}
