import { useState, useMemo, useCallback } from 'react';
import { useBpmnStore } from '@/store/bpmnStore';
import type { Edge } from '@xyflow/react';
import type { BpmnEdgeData } from '@/types/bpmn';

interface UniqueCondition {
  key: string;
  name: string;
  expression: string;
  edgeCount: number;
  edgeIds: string[];
}

export function ConditionPanel() {
  const { edges, nodes, updateEdgeData, removeEdge } = useBpmnStore();
  const [manualSelectedId, setManualSelectedId] = useState('');

  // 自动检测 React Flow 中被选中的边，也支持从列表手动选择
  const rfSelectedEdge = useMemo(() => edges.find(e => e.selected) || null, [edges]);
  const selectedEdge = useMemo(() => {
    if (rfSelectedEdge) return rfSelectedEdge;
    if (manualSelectedId) return edges.find(e => e.id === manualSelectedId) || null;
    return null;
  }, [rfSelectedEdge, manualSelectedId, edges]);
  const selectedEdgeId = selectedEdge?.id || '';
  const [editingField, setEditingField] = useState<'name' | 'expression' | null>(null);
  const [editValue, setEditValue] = useState('');

  // 从所有边中提取去重条件
  const uniqueConditions = useMemo(() => {
    const map = new Map<string, UniqueCondition>();
    for (const edge of edges) {
      const name = edge.data?.conditionName || '';
      const expr = edge.data?.conditionExpression || '';
      if (!name && !expr) continue;

      const key = `${name}|||${expr}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.edgeCount++;
        existing.edgeIds.push(edge.id);
      } else {
        map.set(key, { key, name, expression: expr, edgeCount: 1, edgeIds: [edge.id] });
      }
    }
    return Array.from(map.values());
  }, [edges]);

  // 获取边的源/目标节点名称
  const getEdgeLabel = useCallback((edge: Edge<BpmnEdgeData>) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    const srcLabel = sourceNode?.data.label || edge.source;
    const tgtLabel = targetNode?.data.label || edge.target;
    return `${srcLabel} → ${tgtLabel}`;
  }, [nodes]);

  const handleStartEdit = (field: 'name' | 'expression', value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSaveEdit = () => {
    if (!selectedEdgeId || !editingField) return;
    const field = editingField === 'name' ? 'conditionName' : 'conditionExpression';
    updateEdgeData(selectedEdgeId, { [field]: editValue });
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleClearCondition = () => {
    if (!selectedEdgeId) return;
    updateEdgeData(selectedEdgeId, { conditionName: undefined, conditionExpression: undefined });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background--surface)' }}>
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-color)' }}>
          条件管理
        </h3>
        <span style={{ fontSize: 10, color: 'var(--text-color--disabled)' }}>
          {uniqueConditions.length} 个条件 · {edges.length} 条连线
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* 选中边的属性编辑区 */}
        {selectedEdge && (
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', background: 'var(--color--blue-50)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color--blue-600)' }}>
                ✏️ 编辑连线
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  onClick={handleClearCondition}
                  style={{
                    padding: '1px 6px', fontSize: 10, color: 'var(--color--red-500)',
                    background: 'var(--background--surface)', border: '1px solid var(--color--red-200)',
                    borderRadius: 'var(--radius--3xs)', cursor: 'pointer',
                  }}
                >
                  清除条件
                </button>
                <button
                  onClick={() => removeEdge(selectedEdgeId)}
                  style={{
                    padding: '1px 6px', fontSize: 10, color: 'var(--color--red-500)',
                    background: 'var(--background--surface)', border: '1px solid var(--color--red-200)',
                    borderRadius: 'var(--radius--3xs)', cursor: 'pointer',
                  }}
                >
                  删除线
                </button>
                <button
                  onClick={() => setManualSelectedId('')}
                  style={{
                    padding: '1px 6px', fontSize: 10, color: 'var(--text-color--subtler)',
                    background: 'var(--background--surface)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius--3xs)', cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ fontSize: 10, color: 'var(--text-color--subtler)', marginBottom: 6 }}>
              {getEdgeLabel(selectedEdge)}
            </div>

            {/* 条件名称 */}
            <div style={{ marginBottom: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text-color--subtler)', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                条件名称 (name)
              </label>
              {editingField === 'name' ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                    autoFocus
                    style={{
                      flex: 1, padding: '3px 6px', fontSize: 11,
                      border: '1px solid var(--color--blue-400)', borderRadius: 'var(--radius--3xs)',
                      outline: 'none', background: 'var(--background--surface)', color: 'var(--text-color)',
                    }}
                  />
                  <button onClick={handleSaveEdit} style={{ padding: '2px 6px', fontSize: 10, background: 'var(--color--blue-500)', color: '#fff', border: 'none', borderRadius: 'var(--radius--3xs)', cursor: 'pointer' }}>✓</button>
                  <button onClick={handleCancelEdit} style={{ padding: '2px 6px', fontSize: 10, background: 'var(--color--neutral-200)', color: 'var(--text-color)', border: 'none', borderRadius: 'var(--radius--3xs)', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <div
                  onClick={() => handleStartEdit('name', selectedEdge.data?.conditionName || '')}
                  style={{
                    padding: '3px 6px', fontSize: 11, background: 'var(--background--surface)',
                    border: '1px solid var(--border-color--subtle)', borderRadius: 'var(--radius--3xs)',
                    cursor: 'pointer', color: selectedEdge.data?.conditionName ? 'var(--text-color)' : 'var(--text-color--disabled)',
                    minHeight: 18,
                  }}
                >
                  {selectedEdge.data?.conditionName || '点击设置...'}
                </div>
              )}
            </div>

            {/* 条件表达式 */}
            <div>
              <label style={{ fontSize: 10, color: 'var(--text-color--subtler)', fontWeight: 500, display: 'block', marginBottom: 2 }}>
                条件表达式 (expression)
              </label>
              {editingField === 'expression' ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                    autoFocus
                    style={{
                      flex: 1, padding: '3px 6px', fontSize: 11, fontFamily: 'monospace',
                      border: '1px solid var(--color--blue-400)', borderRadius: 'var(--radius--3xs)',
                      outline: 'none', background: 'var(--background--surface)', color: 'var(--text-color)',
                    }}
                  />
                  <button onClick={handleSaveEdit} style={{ padding: '2px 6px', fontSize: 10, background: 'var(--color--blue-500)', color: '#fff', border: 'none', borderRadius: 'var(--radius--3xs)', cursor: 'pointer' }}>✓</button>
                  <button onClick={handleCancelEdit} style={{ padding: '2px 6px', fontSize: 10, background: 'var(--color--neutral-200)', color: 'var(--text-color)', border: 'none', borderRadius: 'var(--radius--3xs)', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <div
                  onClick={() => handleStartEdit('expression', selectedEdge.data?.conditionExpression || '')}
                  style={{
                    padding: '3px 6px', fontSize: 11, fontFamily: 'monospace', background: 'var(--background--surface)',
                    border: '1px solid var(--border-color--subtle)', borderRadius: 'var(--radius--3xs)',
                    cursor: 'pointer', color: selectedEdge.data?.conditionExpression ? 'var(--text-color)' : 'var(--text-color--disabled)',
                    minHeight: 18, wordBreak: 'break-all',
                  }}
                >
                  {selectedEdge.data?.conditionExpression || '点击设置...'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 去重条件列表 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 12px' }}>
          {uniqueConditions.length === 0 && (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-color--disabled)', fontSize: 11 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>📋</div>
              暂无条件
              <div style={{ fontSize: 10, marginTop: 4, color: 'var(--text-color--disabled)' }}>
                点击连线可设置条件
              </div>
            </div>
          )}

          {uniqueConditions.map(cond => (
            <div
              key={cond.key}
              style={{
                padding: '6px 8px',
                marginBottom: 4,
                background: 'var(--background--subtle)',
                border: '1px solid var(--border-color--subtle)',
                borderRadius: 'var(--radius--3xs)',
                transition: 'background var(--duration--snappy)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color--blue-50)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--background--subtle)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-color)' }}>
                  {cond.name || '(无名称)'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-color--disabled)' }}>
                  {cond.edgeCount} 条连线
                </span>
              </div>
              {cond.expression && (
                <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-color--subtler)', marginTop: 2, wordBreak: 'break-all' }}>
                  {cond.expression}
                </div>
              )}
              {/* 使用此条件的连线列表 */}
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {cond.edgeIds.map(eid => {
                  const edge = edges.find(e => e.id === eid);
                  if (!edge) return null;
                  const isSelected = selectedEdgeId === eid;
                  return (
                    <button
                      key={eid}
                      onClick={() => setManualSelectedId(eid)}
                      style={{
                        padding: '1px 6px',
                        fontSize: 9,
                        color: isSelected ? '#fff' : 'var(--color--blue-600)',
                        background: isSelected ? 'var(--color--blue-500)' : 'var(--color--blue-50)',
                        border: `1px solid ${isSelected ? 'var(--color--blue-500)' : 'var(--color--blue-200)'}`,
                        borderRadius: 'var(--radius--full)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={getEdgeLabel(edge)}
                    >
                      {getEdgeLabel(edge)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 所有连线列表 */}
        <div style={{ borderTop: '1px solid var(--border-color)', maxHeight: 120, overflow: 'auto', padding: '6px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-color--subtler)', fontWeight: 600, marginBottom: 4 }}>
            所有连线
          </div>
          {edges.map(edge => {
            const hasCond = edge.data?.conditionName || edge.data?.conditionExpression;
            const isSelected = selectedEdgeId === edge.id;
            return (
              <div
                key={edge.id}
                onClick={() => setManualSelectedId(edge.id)}
                style={{
                  padding: '3px 6px',
                  marginBottom: 2,
                  fontSize: 10,
                  borderRadius: 'var(--radius--3xs)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--color--blue-50)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--color--blue-200)' : 'transparent'}`,
                  color: 'var(--text-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all var(--duration--snappy)',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--background--subtle)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getEdgeLabel(edge)}
                </span>
                <span style={{ color: hasCond ? 'var(--color--green-500)' : 'var(--text-color--disabled)', flexShrink: 0, marginLeft: 4 }}>
                  {hasCond ? '✓' : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
