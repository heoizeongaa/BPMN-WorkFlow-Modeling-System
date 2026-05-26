import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node as RfNode } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type BpmnNode = RfNode<BpmnNodeData>;

export function EndEventNode({ data, selected }: NodeProps<BpmnNode>) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: `4px solid ${selected ? '#1890ff' : '#ff4d4f'}`,
        background: selected ? '#e6f7ff' : '#fff1f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? '0 0 0 3px #1890ff40' : '0 1px 4px rgba(0,0,0,0.12)',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: selected ? '#1890ff' : '#ff4d4f',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', width: 6, height: 6, border: 'none' }}
      />
    </div>
  );
}
