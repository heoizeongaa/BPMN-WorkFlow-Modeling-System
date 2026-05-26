import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node as RfNode } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type BpmnNode = RfNode<BpmnNodeData>;

export function ParallelGatewayNode({ data, selected }: NodeProps<BpmnNode>) {
  const size = 50;
  const half = size / 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        filter: selected ? 'drop-shadow(0 0 4px #1890ff80)' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))',
        transition: 'filter 0.2s',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <polygon
          points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`}
          fill={selected ? '#e6f7ff' : '#f0f5ff'}
          stroke={selected ? '#1890ff' : '#2f54eb'}
          strokeWidth={2}
        />
        <line x1={half} y1={16} x2={half} y2={34} stroke={selected ? '#1890ff' : '#2f54eb'} strokeWidth={2.5} />
        <line x1={16} y1={half} x2={34} y2={half} stroke={selected ? '#1890ff' : '#2f54eb'} strokeWidth={2.5} />
      </svg>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', width: 6, height: 6, border: 'none', left: -3, top: half - 3 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555', width: 6, height: 6, border: 'none', right: -3, top: half - 3 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#555', width: 6, height: 6, border: 'none', bottom: -3, left: half - 3 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: '#555', width: 6, height: 6, border: 'none', top: -3, left: half - 3 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{ background: '#555', width: 6, height: 6, border: 'none', top: -3, left: half - 3 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ background: '#555', width: 6, height: 6, border: 'none', bottom: -3, left: half - 3 }}
      />
    </div>
  );
}
