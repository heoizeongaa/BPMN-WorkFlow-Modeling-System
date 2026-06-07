import { EdgeLabelRenderer, Position } from '@xyflow/react';
import type { EdgeProps, Edge as RfEdge } from '@xyflow/react';
import type { BpmnEdgeData } from '@/types/bpmn';
import { getEdgeRenderData } from '@/utils/getEdgeRenderData';
import { useState, useRef, useEffect, useCallback } from 'react';

type BpmnEdgeType = RfEdge<BpmnEdgeData>;

const HOVER_DELAY = 600; // 600ms 粘滞延迟

export function BpmnEdge({
  id,
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

  // 600ms hover 延迟逻辑（来自 n8n）
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
  });

  const strokeWidth = selected ? 2.5 : hovered ? 2.5 : 1.5;

  // oklch 颜色随缩放变化（CSS 变量由 BpmnCanvas 注入）
  const strokeColor = isRejectFlow
    ? 'var(--bpmn--edge--reject)'
    : selected
      ? 'var(--bpmn--edge--selected)'
      : 'var(--bpmn--edge--color)';

  const labelPos = renderData.labelPosition;

  return (
    <g
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        opacity: delayedHovered ? 1 : hovered ? 1 : selected ? 1 : 0.85,
        transition: 'opacity 0.3s ease',
      }}
    >
      {renderData.segments.map((seg, i) => (
        <path
          key={`${id}-${i}`}
          className="react-flow__edge-path bpmn-edge--path"
          d={seg.path}
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          fill="none"
          strokeDasharray={isRejectFlow ? '5,3' : undefined}
          style={{
            transition: `stroke-width 0.15s ease, stroke 0.3s ease`,
          }}
        />
      ))}

      {/* hover 时连线变暗的效果 */}
      {delayedHovered && !selected && (
        <>
          {renderData.segments.map((seg, i) => (
            <path
              key={`${id}-hover-${i}`}
              d={seg.path}
              strokeWidth={strokeWidth + 0.5}
              stroke={isRejectFlow ? 'var(--bpmn--edge--reject)' : 'var(--bpmn--edge--color)'}
              fill="none"
              strokeDasharray={isRejectFlow ? '5,3' : undefined}
              opacity={0.3}
              style={{ pointerEvents: 'none' }}
            />
          ))}
        </>
      )}

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
    </g>
  );
}
