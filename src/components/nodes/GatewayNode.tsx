import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node as RfNode } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type BpmnNode = RfNode<BpmnNodeData>;

export function GatewayNode({ data: _data, selected }: NodeProps<BpmnNode>) {
  const size = 44;
  const half = size / 2;

  return (
    <div
      className={`bpmn-node bpmn-node--gateway${selected ? ' bpmn-node--selected' : ''}`}
      style={{ width: 60, height: 60 }}
    >
      <Handle type="target" position={Position.Left} className="bpmn-handle" />
      <Handle type="source" position={Position.Right} className="bpmn-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="bpmn-handle" />
      <Handle type="source" position={Position.Top} id="top" className="bpmn-handle" />
      <Handle type="target" position={Position.Top} id="top-target" className="bpmn-handle" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="bpmn-handle" />
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`}
          fill="var(--bpmn--exclusive--bg)"
          stroke="var(--bpmn--exclusive--color)"
          strokeWidth={2}
        />
        <line x1={14} y1={14} x2={30} y2={30} stroke="var(--bpmn--exclusive--color)" strokeWidth={2.5} />
        <line x1={30} y1={14} x2={14} y2={30} stroke="var(--bpmn--exclusive--color)" strokeWidth={2.5} />
      </svg>
    </div>
  );
}
