import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node as RfNode } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type BpmnNode = RfNode<BpmnNodeData>;

export function EndEventNode({ data: _data, selected }: NodeProps<BpmnNode>) {
  return (
    <div
      className={`bpmn-node bpmn-node--end${selected ? ' bpmn-node--selected' : ''}`}
      style={{ width: 60, height: 60 }}
    >
      <Handle type="target" position={Position.Left} className="bpmn-handle" />
      <div className="bpmn-node__inner-dot" />
    </div>
  );
}
