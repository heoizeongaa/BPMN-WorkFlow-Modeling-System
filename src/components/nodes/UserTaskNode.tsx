import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node as RfNode } from '@xyflow/react';
import type { BpmnNodeData } from '@/types/bpmn';

type BpmnNode = RfNode<BpmnNodeData>;

export function UserTaskNode({ data, selected }: NodeProps<BpmnNode>) {
  return (
    <div
      style={{
        width: 160,
        height: 60,
        borderRadius: 8,
        border: `2px solid ${selected ? '#1890ff' : '#91d5ff'}`,
        background: selected ? '#e6f7ff' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 500,
        color: '#333',
        padding: '4px 12px',
        textAlign: 'center',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxShadow: selected ? '0 0 0 3px #1890ff40' : '0 2px 6px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.2s, border-color 0.2s, background 0.2s',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: 5,
          fontSize: 10,
          color: selected ? '#1890ff' : '#91d5ff',
          lineHeight: 1,
          fontWeight: 700,
        }}
      >
        □
      </div>
      <span>{data.label}</span>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', width: 6, height: 6, border: 'none' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555', width: 6, height: 6, border: 'none' }}
      />
    </div>
  );
}
