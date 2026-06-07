import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '@/components/Toolbar';
import { BpmnCanvas } from '@/components/BpmnCanvas';
import { DslPanel } from '@/components/panels/DslPanel';
import { AiPanel } from '@/components/panels/AiPanel';
import { ConditionPanel } from '@/components/panels/ConditionPanel';

const LEFT_PANEL_WIDTH = 360;

type PanelMode = 'ai' | 'dsl';

export default function App() {
  const [panelMode, setPanelMode] = useState<PanelMode>('ai');

  // 初始化时检测系统暗色偏好
  useEffect(() => {
    const saved = localStorage.getItem('bpmn-theme');
    if (saved) {
      document.body.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.setAttribute('data-theme', 'dark');
    }
  }, []);

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
          <div
            style={{
              width: LEFT_PANEL_WIDTH,
              minWidth: LEFT_PANEL_WIDTH,
              background: 'var(--background--surface)',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '2px 0 8px var(--color--black-alpha-50)',
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

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {panelMode === 'ai' ? <AiPanel /> : <DslPanel />}
            </div>
            <div style={{ height: 260, borderTop: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <ConditionPanel />
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <BpmnCanvas />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
