import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useOnViewportChange,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '@/styles/tokens.css';
import '@/styles/nodes.css';
import { useBpmnStore } from '@/store/bpmnStore';
import { StartEventNode, EndEventNode, UserTaskNode, GatewayNode } from '@/components/nodes';
import { BpmnEdge } from '@/components/edges';
import { useZoomAdjustedValues } from '@/hooks/useZoomAdjustedValues';
import { useAlignmentGuides, AlignmentGuidesOverlay } from '@/hooks/useAlignmentGuides';
import { useCanvasContextMenu, ContextMenuOverlay } from '@/hooks/useCanvasContextMenu';

const nodeTypes = {
  startEvent: StartEventNode,
  endEvent: EndEventNode,
  userTask: UserTaskNode,
  exclusiveGateway: GatewayNode,
  parallelGateway: GatewayNode,
  inclusiveGateway: GatewayNode,
  serviceTask: UserTaskNode,
  scriptTask: UserTaskNode,
  sendTask: UserTaskNode,
  receiveTask: UserTaskNode,
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
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onReconnect } = useBpmnStore();
  const { updateEdgeData, connectNodes } = useBpmnStore();
  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  // 缩放自适应
  const { containerRef, scheduleUpdate } = useZoomAdjustedValues();

  // 对齐辅助线
  const { guideLines, onNodeDragStart, onNodeDrag, onNodeDragStop } = useAlignmentGuides();

  // 连线模式
  const { connectSource, setConnectSource } = useBpmnStore();

  // 右键菜单
  const {
    contextMenu, showContextMenu, hideContextMenu,
    deleteNode, deleteEdge, duplicateNode, menuRef,
  } = useCanvasContextMenu();

  // 视口
  const viewport = useViewport();

  // 小地图
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

  const handlePaneScroll = useCallback(() => showMinimap(), [showMinimap]);
  const handleMoveEnd = useCallback(() => { scheduleUpdate(); scheduleHideMinimap(); }, [scheduleUpdate, scheduleHideMinimap]);
  const handleMoveStart = useCallback(() => { showMinimap(); scheduleUpdate(); }, [showMinimap, scheduleUpdate]);

  useOnViewportChange({ onEnd: () => scheduleUpdate() });

  useEffect(() => () => clearTimeout(hideTimeoutRef.current), []);

  const handleConnect = useCallback(
    (connection: Parameters<typeof onConnect>[0]) => onConnect(connection),
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

  // 右键节点
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: { id: string }) => {
    showContextMenu(event, 'node', node.id);
  }, [showContextMenu]);

  // 右键连线
  const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: { id: string }) => {
    showContextMenu(event, 'edge', edge.id);
  }, [showContextMenu]);

  // 右键空白
  const handlePaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    showContextMenu(event as React.MouseEvent, 'pane');
  }, [showContextMenu]);

  // 双击节点编辑标签
  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: { id: string; data: { label?: string } }) => {
    const newLabel = window.prompt('编辑节点名称:', node.data.label || '');
    if (newLabel !== null) {
      const store = useBpmnStore.getState();
      const updatedNodes = store.nodes.map(n =>
        n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n
      );
      useBpmnStore.setState({ nodes: updatedNodes });
    }
  }, []);

  // 点击空白区域关闭菜单
  const handlePaneClick = useCallback(() => {
    hideContextMenu();
    setConnectSource(null); // 取消连线模式
  }, [hideContextMenu]);

  // 节点点击（连线模式）
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: { id: string }) => {
    if (connectSource === '__WAITING__') {
      // 第一次点击：选择源节点
      setConnectSource(node.id);
    } else if (connectSource && connectSource !== '__WAITING__') {
      // 第二次点击：连接到目标
      connectNodes(connectSource, node.id);
      setConnectSource(null);
    }
  }, [connectSource, connectNodes, setConnectSource]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onReconnect={onReconnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={proOptions}
        deleteKeyCode={['Backspace', 'Delete']}
        minZoom={0.1}
        maxZoom={2}
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        onPaneScroll={handlePaneScroll}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        selectionKeyCode={null}
        multiSelectionKeyCode="Shift"
      >
        <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
          <defs>
            <marker id="arrow-default" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--bpmn--edge--color)" />
            </marker>
            <marker id="arrow-selected" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--bpmn--edge--selected)" />
            </marker>
            <marker id="arrow-reject" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
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
            position: 'absolute', bottom: 10, left: 10,
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
                default: return 'var(--bpmn--task--color)';
              }
            }}
            maskColor="rgba(0,0,0,0.05)"
          />
        </div>
        <AlignmentGuidesOverlay guideLines={guideLines} viewport={viewport} />
      </ReactFlow>

      {/* 连线模式提示 */}
      {connectSource && connectSource !== null && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 16px',
            background: 'var(--color--blue-600)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 'var(--radius--full)',
            boxShadow: 'var(--shadow--md)',
            zIndex: 100,
            pointerEvents: 'none',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {connectSource === '__WAITING__'
            ? '🔗 点击源节点开始连线 · 点击空白取消'
            : '🔗 点击目标节点完成连线 · 点击空白取消'}
        </div>
      )}

      {/* 右键菜单 */}
      <ContextMenuOverlay
        menu={contextMenu}
        menuRef={menuRef}
        onDeleteNode={deleteNode}
        onDeleteEdge={deleteEdge}
        onDuplicateNode={duplicateNode}
        onClose={hideContextMenu}
      />
    </div>
  );
}
