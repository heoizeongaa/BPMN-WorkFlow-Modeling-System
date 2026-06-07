import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node as RfNode } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type BpmnNode = RfNode<BpmnNodeData>;

export function ExclusiveGatewayNode({ data: _data, selected }: NodeProps<BpmnNode>) {
  const size = 50;
  const half = size / 2;

  return (
    <div className={`bpmn-node--gateway${selected ? ' bpmn-node--selected' : ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`}
          fill="var(--bpmn--exclusive--bg)"
          stroke="var(--bpmn--exclusive--color)"
          strokeWidth={2}
        />
        <line x1={16} y1={16} x2={34} y2={34} stroke="var(--bpmn--exclusive--color)" strokeWidth={2.5} />
        <line x1={34} y1={16} x2={16} y2={34} stroke="var(--bpmn--exclusive--color)" strokeWidth={2.5} />
      </svg>
      <Handle type="target" position={Position.Left} className="bpmn-handle" style={{ left: -3, top: half - 3 }} />
      <Handle type="source" position={Position.Right} className="bpmn-handle" style={{ right: -3, top: half - 3 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" className="bpmn-handle" style={{ bottom: -3, left: half - 3 }} />
      <Handle type="source" position={Position.Top} id="top" className="bpmn-handle" style={{ top: -3, left: half - 3 }} />
      <Handle type="target" position={Position.Top} id="top-target" className="bpmn-handle" style={{ top: -3, left: half - 3 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="bpmn-handle" style={{ bottom: -3, left: half - 3 }} />
    </div>
  );
}
