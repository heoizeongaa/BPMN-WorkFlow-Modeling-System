import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '@/components/Toolbar';
import { BpmnCanvas } from '@/components/BpmnCanvas';
import { DslPanel } from '@/components/panels/DslPanel';
import { ConditionPanel } from '@/components/panels/ConditionPanel';

const LEFT_PANEL_WIDTH = 320;

export default function App() {
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
          background: '#f0f2f5',
        }}
      >
        <Toolbar />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div
            style={{
              width: LEFT_PANEL_WIDTH,
              minWidth: LEFT_PANEL_WIDTH,
              background: '#fff',
              borderRight: '1px solid #e8e8e8',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <DslPanel />
            </div>
            <div style={{ height: 300, borderTop: '1px solid #e8e8e8', overflow: 'hidden' }}>
              <ConditionPanel />
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', background: '#fafafa' }}>
            <BpmnCanvas />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
