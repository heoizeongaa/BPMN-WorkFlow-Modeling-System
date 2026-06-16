import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '@/components/Toolbar';
import { BpmnCanvas } from '@/components/BpmnCanvas';
import { DslPanel } from '@/components/panels/DslPanel';
import { AiPanel } from '@/components/panels/AiPanel';
import { ConditionPanel } from '@/components/panels/ConditionPanel';

type PanelMode = 'ai' | 'dsl';

export default function App() {
  const [panelMode, setPanelMode] = useState<PanelMode>('ai');

  // 可调整尺寸
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem('bpmn-panel-width');
    return saved ? Number(saved) : 360;
  });
  const [condHeight, setCondHeight] = useState(() => {
    const saved = localStorage.getItem('bpmn-cond-height');
    return saved ? Number(saved) : 260;
  });

  const dragRef = useRef<{ type: 'width' | 'height'; startPos: number; startValue: number } | null>(null);

  // 初始化时检测系统暗色偏好
  useEffect(() => {
    const saved = localStorage.getItem('bpmn-theme');
    if (saved) {
      document.body.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.setAttribute('data-theme', 'dark');
    }
  }, []);

  const handleMouseDown = useCallback((type: 'width' | 'height', e: React.MouseEvent) => {
    e.preventDefault();
    const startPos = type === 'width' ? e.clientX : e.clientY;
    const startValue = type === 'width' ? panelWidth : condHeight;
    dragRef.current = { type, startPos, startValue };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const { type: t, startPos: sp, startValue: sv } = dragRef.current;

      if (t === 'width') {
        const delta = ev.clientX - sp;
        const newWidth = Math.min(Math.max(sv + delta, 240), 600);
        setPanelWidth(newWidth);
      } else {
        const delta = sp - ev.clientY; // 向上拖 = 增大
        const newHeight = Math.min(Math.max(sv + delta, 100), 500);
        setCondHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('bpmn-panel-width', String(panelWidth));
      localStorage.setItem('bpmn-cond-height', String(condHeight));
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.cursor = type === 'width' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [panelWidth, condHeight]);

  // 拖拽结束时也保存（处理快速释放的情况）
  useEffect(() => {
    localStorage.setItem('bpmn-panel-width', String(panelWidth));
  }, [panelWidth]);

  useEffect(() => {
    localStorage.setItem('bpmn-cond-height', String(condHeight));
  }, [condHeight]);

  return (
    <ReactFlowProvider>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: 'var(--canvas--color--background)',
        }}
      >
        <Toolbar />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 左侧面板 */}
          <div
            style={{
              width: panelWidth,
              minWidth: 240,
              maxWidth: 600,
              background: 'var(--background--surface)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Tab Bar */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--background--subtle)',
              }}
            >
              <button
                onClick={() => setPanelMode('ai')}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: 'var(--font-size--xs)',
                  fontWeight: panelMode === 'ai' ? 600 : 400,
                  color: panelMode === 'ai' ? 'var(--color--purple-600)' : 'var(--text-color--subtler)',
                  background: panelMode === 'ai' ? 'var(--background--surface)' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${panelMode === 'ai' ? 'var(--color--purple-600)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all var(--duration--snappy) var(--easing--ease-out)',
                }}
              >
                🤖 AI 建模
              </button>
              <button
                onClick={() => setPanelMode('dsl')}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: 'var(--font-size--xs)',
                  fontWeight: panelMode === 'dsl' ? 600 : 400,
                  color: panelMode === 'dsl' ? 'var(--color--blue-600)' : 'var(--text-color--subtler)',
                  background: panelMode === 'dsl' ? 'var(--background--surface)' : 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${panelMode === 'dsl' ? 'var(--color--blue-600)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all var(--duration--snappy) var(--easing--ease-out)',
                }}
              >
                📝 DSL 编辑
              </button>
            </div>

            {/* AI / DSL 面板 */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {panelMode === 'ai' ? <AiPanel /> : <DslPanel />}
            </div>

            {/* 水平拖拽条（调整 Condition 面板高度） */}
            <div
              onMouseDown={e => handleMouseDown('height', e)}
              style={{
                height: 5,
                cursor: 'row-resize',
                background: 'var(--border-color)',
                transition: 'background 0.15s',
                flexShrink: 0,
                position: 'relative',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color--blue-400)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--border-color)')}
            >
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 24, height: 3, borderRadius: 2,
                background: 'var(--color--neutral-400)',
                pointerEvents: 'none',
              }} />
            </div>

            {/* Condition 面板 */}
            <div style={{ height: condHeight, overflow: 'hidden' }}>
              <ConditionPanel />
            </div>

            {/* 垂直拖拽条（调整左侧面板宽度） */}
            <div
              onMouseDown={e => handleMouseDown('width', e)}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 5,
                height: '100%',
                cursor: 'col-resize',
                zIndex: 20,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color--blue-400)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />
          </div>

          {/* 画布 */}
          <div style={{ flex: 1, overflow: 'hidden', borderLeft: '1px solid var(--border-color)' }}>
            <BpmnCanvas />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
