import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node as RfNode } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type BpmnNode = RfNode<BpmnNodeData>;

export function StartEventNode({ data, selected }: NodeProps<BpmnNode>) {
  return (
    <div className={`bpmn-node bpmn-node--start${selected ? ' bpmn-node--selected' : ''}`}>
      <div className="bpmn-node__inner-dot" />
      <Handle
        type="source"
        position={Position.Right}
        className="bpmn-handle"
      />
    </div>
  );
}
