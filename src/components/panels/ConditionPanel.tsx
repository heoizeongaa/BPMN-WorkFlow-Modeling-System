import { useState, useCallback } from 'react';
import { useBpmnStore } from '@/store/bpmnStore';

export function ConditionPanel() {
  const { conditions, addCondition, removeCondition, edges, assignConditionToEdge } = useBpmnStore();
  const [newName, setNewName] = useState('');
  const [newExpr, setNewExpr] = useState('');
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [selectedCondId, setSelectedCondId] = useState('');

  const handleAdd = useCallback(() => {
    if (!newName.trim()) return;
    addCondition(newName.trim(), newExpr.trim());
    setNewName('');
    setNewExpr('');
  }, [newName, newExpr, addCondition]);

  const handleAssign = useCallback(() => {
    if (selectedEdgeId && selectedCondId) {
      assignConditionToEdge(selectedEdgeId, selectedCondId);
      setSelectedEdgeId('');
      setSelectedCondId('');
    }
  }, [selectedEdgeId, selectedCondId, assignConditionToEdge]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background--surface)' }}>
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-color)' }}>Conditions</h3>
        <span style={{ fontSize: 10, color: 'var(--text-color--disabled)' }}>{conditions.length} items</span>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name"
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: 11,
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius--3xs)',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--background--surface)',
              color: 'var(--text-color)',
            }}
          />
          <input
            value={newExpr}
            onChange={e => setNewExpr(e.target.value)}
            placeholder="Expression"
            style={{
              flex: 1.5,
              padding: '4px 8px',
              fontSize: 11,
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius--3xs)',
              outline: 'none',
              boxSizing: 'border-box',
              background: 'var(--background--surface)',
              color: 'var(--text-color)',
            }}
          />
        </div>
        <button
          onClick={handleAdd}
          style={{
            width: '100%',
            padding: '3px 8px',
            fontSize: 11,
            color: '#fff',
            background: 'var(--color--green-500)',
            border: 'none',
            borderRadius: 'var(--radius--3xs)',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          + Add Condition
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '6px 12px' }}>
        {conditions.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text-color--disabled)', textAlign: 'center', padding: 12 }}>
            No conditions yet
          </div>
        )}
        {conditions.map(cond => (
          <div
            key={cond.id}
            style={{
              padding: '5px 8px',
              marginBottom: 3,
              background: 'var(--background--subtle)',
              border: '1px solid var(--border-color--subtle)',
              borderRadius: 'var(--radius--3xs)',
              fontSize: 11,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'background var(--duration--snappy)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color--blue-50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--background--subtle)')}
          >
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-color)', whiteSpace: 'nowrap' }}>{cond.name}</div>
              <div style={{ color: 'var(--text-color--subtler)', fontFamily: 'monospace', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cond.expression}
              </div>
            </div>
            <button
              onClick={() => removeCondition(cond.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color--red-400)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '0 4px',
                lineHeight: 1,
                opacity: 0.6,
                transition: 'opacity var(--duration--snappy)',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 12px 10px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-color--subtler)', marginBottom: 4, fontWeight: 500 }}>ASSIGN TO EDGE</div>
        <select
          value={selectedEdgeId}
          onChange={e => setSelectedEdgeId(e.target.value)}
          style={{
            width: '100%',
            padding: '3px 6px',
            fontSize: 11,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius--3xs)',
            marginBottom: 3,
            boxSizing: 'border-box',
            color: 'var(--text-color)',
            background: 'var(--background--surface)',
          }}
        >
          <option value="">Select edge...</option>
          {edges.map(e => (
            <option key={e.id} value={e.id}>
              {e.source} → {e.target}
            </option>
          ))}
        </select>
        <select
          value={selectedCondId}
          onChange={e => setSelectedCondId(e.target.value)}
          style={{
            width: '100%',
            padding: '3px 6px',
            fontSize: 11,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius--3xs)',
            marginBottom: 4,
            boxSizing: 'border-box',
            color: 'var(--text-color)',
            background: 'var(--background--surface)',
          }}
        >
          <option value="">Select condition...</option>
          {conditions.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={!selectedEdgeId || !selectedCondId}
          style={{
            width: '100%',
            padding: '3px 8px',
            fontSize: 11,
            color: '#fff',
            background: selectedEdgeId && selectedCondId ? 'var(--color--blue-600)' : 'var(--color--neutral-300)',
            border: 'none',
            borderRadius: 'var(--radius--3xs)',
            cursor: selectedEdgeId && selectedCondId ? 'pointer' : 'not-allowed',
            fontWeight: 500,
          }}
        >
          Assign
        </button>
      </div>
    </div>
  );
}
