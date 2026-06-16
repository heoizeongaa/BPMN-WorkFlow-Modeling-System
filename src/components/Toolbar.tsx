import { useBpmnStore } from '@/store/bpmnStore';
import { exportToBpmnXml, type BpmnExportVersion } from '@/utils/bpmnExporter';
import { useState, useEffect } from 'react';

export function Toolbar() {
  const { nodes, edges, processName, relayout, isLayouting, addNode, connectSource, setConnectSource } = useBpmnStore();

  // 暗色模式状态
  const [isDark, setIsDark] = useState(() => {
    return document.body.getAttribute('data-theme') === 'dark';
  });

  // 导出版本
  const [exportVersion, setExportVersion] = useState<BpmnExportVersion>('activiti');

  useEffect(() => {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('bpmn-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleExport = () => {
    const xml = exportToBpmnXml(nodes, edges, processName, exportVersion);
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
    addNode('exclusiveGateway', '', { x: maxX, y: 100 });
  };

  return (
    <div
      style={{
        height: 48,
        background: 'var(--background--surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--spacing--sm)',
        gap: 6,
        boxShadow: 'var(--shadow--xs)',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 16 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius--2xs)',
            background: 'linear-gradient(135deg, var(--color--blue-600), var(--color--blue-700))',
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
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-color)', letterSpacing: '-0.3px' }}>
          BPMN Modeler
        </span>
      </div>

      <ToolbarDivider />

      <ToolbarButton onClick={handleAddUserTask} icon="☐">
        UserTask
      </ToolbarButton>
      <ToolbarButton onClick={handleAddGateway} icon="◇">
        Gateway
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton onClick={relayout} disabled={isLayouting} icon="📐">
        {isLayouting ? 'Layouting...' : 'Re-layout'}
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        onClick={() => setConnectSource(connectSource ? null : '__WAITING__')}
        icon="🔗"
      >
        {connectSource ? '取消连线' : '连线'}
      </ToolbarButton>

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: 11, color: 'var(--text-color--subtler)', marginRight: 8 }}>
        {nodes.length} nodes · {edges.length} edges
      </div>

      {/* 导出版本选择器 */}
      <select
        value={exportVersion}
        onChange={e => setExportVersion(e.target.value as BpmnExportVersion)}
        style={{
          padding: '5px 8px',
          fontSize: 11,
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius--3xs)',
          background: 'var(--background--surface)',
          color: 'var(--text-color)',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="activiti">Activiti 格式</option>
        <option value="bpmn-io">bpmn.io 格式</option>
      </select>

      <button
        onClick={handleExport}
        style={{
          padding: '6px 16px',
          fontSize: 12,
          fontWeight: 600,
          color: '#fff',
          background: 'linear-gradient(135deg, var(--color--blue-600), var(--color--blue-700))',
          border: 'none',
          borderRadius: 'var(--radius--2xs)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          transition: 'opacity var(--duration--snappy) var(--easing--ease-out)',
        }}
      >
        Export BPMN XML
      </button>

      <button
        onClick={() => setIsDark(!isDark)}
        title={isDark ? '切换亮色模式' : '切换暗色模式'}
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          background: 'transparent',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius--3xs)',
          cursor: 'pointer',
          transition: 'all var(--duration--snappy)',
          marginLeft: 4,
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

function ToolbarDivider() {
  return <div style={{ width: 1, height: 22, background: 'var(--border-color)', margin: '0 4px' }} />;
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
        color: disabled ? 'var(--text-color--disabled)' : 'var(--text-color--subtle)',
        background: disabled ? 'var(--background--subtle)' : 'var(--background--surface)',
        border: `1px solid ${disabled ? 'var(--border-color--subtle)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius--3xs)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        transition: 'all var(--duration--snappy) var(--easing--ease-out)',
      }}
    >
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {children}
    </button>
  );
}
