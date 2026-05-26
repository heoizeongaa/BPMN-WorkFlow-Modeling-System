import { useBpmnStore } from '@/store/bpmnStore';
import { exportToBpmnXml } from '@/utils/bpmnExporter';

export function Toolbar() {
  const { nodes, edges, processName, relayout, isLayouting, addNode } = useBpmnStore();

  const handleExport = () => {
    const xml = exportToBpmnXml(nodes, edges, processName);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${processName.replace(/[^a-zA-Z0-9]/g, '_')}.bpmn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddUserTask = () => {
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x + 200), 100);
    addNode('userTask', 'New Task', { x: maxX, y: 100 });
  };

  const handleAddGateway = () => {
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x + 200), 100);
    addNode('exclusiveGateway', '×', { x: maxX, y: 100 });
  };

  const handleAddParallelGateway = () => {
    const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x + 200), 100);
    addNode('parallelGateway', '+', { x: maxX, y: 100 });
  };

  return (
    <div
      style={{
        height: 48,
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 6,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #1890ff, #096dd9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          B
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.3px' }}>
          BPMN Modeler
        </span>
      </div>

      <ToolbarDivider />

      <ToolbarButton onClick={handleAddUserTask} icon="☐">
        UserTask
      </ToolbarButton>
      <ToolbarButton onClick={handleAddGateway} icon="◇">
        X-Gateway
      </ToolbarButton>
      <ToolbarButton onClick={handleAddParallelGateway} icon="◇">
        +-Gateway
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton onClick={relayout} disabled={isLayouting} icon="📐">
        {isLayouting ? 'Layouting...' : 'Re-layout'}
      </ToolbarButton>

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: 11, color: '#999', marginRight: 8 }}>
        {nodes.length} nodes · {edges.length} edges
      </div>

      <button
        onClick={handleExport}
        style={{
          padding: '6px 16px',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          background: 'linear-gradient(135deg, #1890ff, #096dd9)',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'opacity 0.2s',
        }}
      >
        Export BPMN XML
      </button>
    </div>
  );
}

function ToolbarDivider() {
  return <div style={{ width: 1, height: 22, background: '#e8e8e8', margin: '0 4px' }} />;
}

function ToolbarButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 500,
        color: disabled ? '#bfbfbf' : '#595959',
        background: disabled ? '#fafafa' : '#fff',
        border: `1px solid ${disabled ? '#f0f0f0' : '#d9d9d9'}`,
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all 0.2s',
      }}
    >
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {children}
    </button>
  );
}
