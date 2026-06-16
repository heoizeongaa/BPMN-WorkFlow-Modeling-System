import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node as RfNode } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type BpmnNode = RfNode<BpmnNodeData>;

export function UserTaskNode({ data, selected }: NodeProps<BpmnNode>) {
  return (
    <div className={`bpmn-node bpmn-node--task${selected ? ' bpmn-node--selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="bpmn-handle" />
      <Handle type="source" position={Position.Right} className="bpmn-handle" />
      <div className="bpmn-node__icon">□</div>
      <span>{data.label}</span>
    </div>
  );
}
