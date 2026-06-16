import { EdgeLabelRenderer, Position, useReactFlow } from '@xyflow/react';
import type { EdgeProps, Edge as RfEdge } from '@xyflow/react';
import type { BpmnEdgeData } from '@/types/bpmn';
import { getEdgeRenderData } from '@/utils/getEdgeRenderData';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

type BpmnEdgeType = RfEdge<BpmnEdgeData>;

const HOVER_DELAY = 600;

/** 连接状态指示点大小 */
const STATUS_DOT_SIZE = 8;

export function BpmnEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<BpmnEdgeType>) {
  const isRejectFlow = data?.isRejectFlow;
  const [hovered, setHovered] = useState(false);
  const [delayedHovered, setDelayedHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { getNodes, setEdges } = useReactFlow();

  // 检测连接状态
  const connectionStatus = useMemo(() => {
    const nodes = getNodes();
    const sourceExists = nodes.some(n => n.id === source);
    const targetExists = nodes.some(n => n.id === target);
    if (!sourceExists || !targetExists) return 'error';
    return 'connected';
  }, [getNodes, source, target]);

  const handleMouseEnter = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setHovered(true);
    setDelayedHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    timeoutRef.current = setTimeout(() => setDelayedHovered(false), HOVER_DELAY);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const renderData = getEdgeRenderData({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition || Position.Right,
    targetX,
    targetY,
    targetPosition: targetPosition || Position.Left,
    sourceNode: getNodes().find(n => n.id === source),
    targetNode: getNodes().find(n => n.id === target),
  });

  const strokeWidth = selected ? 2.5 : hovered ? 2 : 1.5;
  const isHealthy = connectionStatus === 'connected';

  // 连线颜色：选中=蓝，悬停=加深，正常=根据状态
  const strokeColor = selected
    ? 'var(--bpmn--edge--selected)'
    : isRejectFlow
      ? 'var(--bpmn--edge--reject)'
      : isHealthy
        ? 'var(--bpmn--edge--color)'
        : 'var(--bpmn--edge--reject)';

  // 状态指示点颜色
  const dotColor = isHealthy ? 'var(--color--green-500)' : 'var(--color--red-500)';
  const dotGlow = isHealthy ? 'var(--color--green-200)' : 'var(--color--red-200)';

  const labelPos = renderData.labelPosition;

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges(edges => edges.filter(edge => edge.id !== id));
  }, [id, setEdges]);

  return (
    <g
      className="react-flow__edge-interaction"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 连线路径 */}
      {renderData.segments.map((seg, i) => (
        <path
          key={`${id}-${i}`}
          className="react-flow__edge-path bpmn-edge--path"
          d={seg.path}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          fill="none"
          strokeDasharray={isRejectFlow ? '5,3' : undefined}
          style={{ transition: 'stroke-width 0.15s ease, stroke 0.2s ease' }}
        />
      ))}

      {/* 源端状态指示点 */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={STATUS_DOT_SIZE / 2}
        fill={dotColor}
        stroke="var(--background--surface)"
        strokeWidth={1.5}
        style={{
          filter: hovered ? `drop-shadow(0 0 3px ${dotGlow})` : 'none',
          transition: 'filter 0.2s ease',
        }}
      />

      {/* 目标端状态指示点 */}
      <circle
        cx={targetX}
        cy={targetY}
        r={STATUS_DOT_SIZE / 2}
        fill={dotColor}
        stroke="var(--background--surface)"
        strokeWidth={1.5}
        style={{
          filter: hovered ? `drop-shadow(0 0 3px ${dotGlow})` : 'none',
          transition: 'filter 0.2s ease',
        }}
      />

      {/* 条件标签 */}
      {data?.conditionName && labelPos && (
        <EdgeLabelRenderer>
          <div
            className="bpmn-edge--label nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelPos.x}px,${labelPos.y}px)`,
            }}
          >
            {data.conditionName}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Hover 删除按钮 */}
      {(hovered || selected) && labelPos && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -150%) translate(${labelPos.x}px,${labelPos.y}px)`,
              background: 'var(--color--red-500)',
              color: '#fff',
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: 'var(--shadow--sm)',
              transition: 'transform 0.15s ease, opacity 0.15s ease',
              opacity: hovered ? 1 : 0.6,
            }}
            onClick={handleDelete}
            onMouseDown={e => e.stopPropagation()}
            title="删除连线"
          >
            ×
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}
