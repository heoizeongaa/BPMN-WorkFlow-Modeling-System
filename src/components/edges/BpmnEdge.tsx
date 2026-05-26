import { getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps, Edge as RfEdge } from '@xyflow/react';
import type { BpmnEdgeData } from '@/types/bpmn';

type BpmnEdge = RfEdge<BpmnEdgeData>;

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
  style = {},
}: EdgeProps<BpmnEdge>) {
  const isRejectFlow = data?.isRejectFlow;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={selected ? 2.5 : 1.5}
        stroke={isRejectFlow ? '#ff4d4f' : selected ? '#1890ff' : '#555'}
        fill="none"
        strokeDasharray={isRejectFlow ? '5,3' : undefined}
      />
      {data?.conditionName && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              background: '#fff',
              padding: '1px 4px',
              borderRadius: 3,
              border: '1px solid #ddd',
              color: '#666',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {data.conditionName}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
