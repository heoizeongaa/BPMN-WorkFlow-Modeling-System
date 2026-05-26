import { useState, useCallback } from 'react';
import { useBpmnStore } from '@/store/bpmnStore';
import { convertRawTextToDsl } from '@/utils/dslConverter';

const EXAMPLE_DSL = `销售审批流程:
  空调(数管部):
    销司:
      销司核算内勤发起
      -> 销司数据核算中心部长审核
      -> 销司运营中心部长审核
      -> 销司副总经理审核
      -> END
    总部:
      销司核算内勤发起
      -> 销司数据核算中心部长审核
      -> 销司运营中心部长审核
      -> 销司副总经理审核
      -> 销司总经理审核
      -> 总部运营主管审批
      -> END
  生活电器(冰洗部):
    销司:
      冰洗核算内勤发起
      -> 冰洗数据核算中心部长审核
      -> 冰洗运营中心部长审核
      -> END
    总部:
      冰洗核算内勤发起
      -> 冰洗数据核算中心部长审核
      -> 冰洗运营中心部长审核
      -> 冰洗总经理审核
      -> 总部运营主管审批
      -> END`;

export function DslPanel() {
  const { dslText, setDslText, generateFromDsl, processName, setProcessName, isLayouting } = useBpmnStore();
  const [localText, setLocalText] = useState(dslText || EXAMPLE_DSL);
  const [rawText, setRawText] = useState('');
  const [showRawInput, setShowRawInput] = useState(false);

  const handleGenerate = useCallback(() => {
    setDslText(localText);
    setTimeout(() => generateFromDsl(), 0);
  }, [localText, setDslText, generateFromDsl]);

  const handleConvertToDsl = useCallback(() => {
    const converted = convertRawTextToDsl(rawText);
    if (converted) {
      setLocalText(converted);
      setDslText(converted);
    }
  }, [rawText, setDslText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>DSL Input</h3>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: '#bfbfbf' }}>Ctrl+Enter to generate</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setShowRawInput(!showRawInput)}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 500,
              color: showRawInput ? '#1890ff' : '#8c8c8c',
              background: showRawInput ? '#e6f7ff' : '#fafafa',
              border: `1px solid ${showRawInput ? '#91d5ff' : '#e8e8e8'}`,
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            Raw Text
          </button>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isLayouting ? '#faad14' : '#52c41a',
            }}
          />
        </div>
      </div>

      {showRawInput && (
        <div
          style={{
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '40%',
            background: '#fffbf0',
          }}
        >
          <div
            style={{
              padding: '6px 12px 2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 10, color: '#d48806', fontWeight: 600, letterSpacing: '0.3px' }}>
              RAW BUSINESS TEXT
            </span>
            <span style={{ fontSize: 9, color: '#d9d9d9' }}>paste workflow description</span>
          </div>
          <div style={{ flex: 1, padding: '0 12px 4px', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                width: '100%',
                minHeight: 60,
                maxHeight: 120,
                padding: 6,
                fontSize: 11,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                lineHeight: 1.6,
                border: '1px solid #ffe58f',
                borderRadius: 4,
                resize: 'none',
                outline: 'none',
                background: '#fffbe6',
                color: '#333',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              placeholder={'Paste raw workflow text here...\ne.g.:\n销售审批流程\n空调(数管部)\n销司：发起人 -> 数据中心主管 -> END\n总部：发起人 -> 数据中心主管 -> 总经理 -> END'}
              onFocus={e => (e.target.style.borderColor = '#ffc53d')}
              onBlur={e => (e.target.style.borderColor = '#ffe58f')}
            />
          </div>
          <div style={{ padding: '4px 12px 8px' }}>
            <button
              onClick={handleConvertToDsl}
              disabled={!rawText.trim()}
              style={{
                width: '100%',
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: '#fff',
                background: rawText.trim()
                  ? 'linear-gradient(135deg, #faad14, #d48806)'
                  : '#d9d9d9',
                border: 'none',
                borderRadius: 4,
                cursor: rawText.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
              }}
            >
              Convert To DSL
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '8px 12px' }}>
        <input
          value={processName}
          onChange={e => setProcessName(e.target.value)}
          placeholder="Process Name"
          style={{
            width: '100%',
            padding: '5px 8px',
            fontSize: 12,
            border: '1px solid #e8e8e8',
            borderRadius: 4,
            outline: 'none',
            boxSizing: 'border-box',
            color: '#333',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = '#1890ff')}
          onBlur={e => (e.target.style.borderColor = '#e8e8e8')}
        />
      </div>

      <div style={{ flex: 1, padding: '0 12px 8px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <textarea
          value={localText}
          onChange={e => setLocalText(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          style={{
            flex: 1,
            width: '100%',
            padding: 8,
            fontSize: 12,
            fontFamily: '"Cascadia Code", Consolas, Monaco, "Courier New", monospace',
            lineHeight: 1.7,
            border: '1px solid #e8e8e8',
            borderRadius: 4,
            resize: 'none',
            outline: 'none',
            background: '#fafafa',
            color: '#333',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          placeholder="Enter DSL here..."
          onFocus={e => {
            e.target.style.borderColor = '#1890ff';
            e.target.style.background = '#fff';
          }}
          onBlur={e => {
            e.target.style.borderColor = '#e8e8e8';
            e.target.style.background = '#fafafa';
          }}
        />
      </div>

      <div style={{ padding: '6px 12px 10px' }}>
        <button
          onClick={handleGenerate}
          disabled={isLayouting}
          style={{
            width: '100%',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            background: isLayouting
              ? '#91d5ff'
              : 'linear-gradient(135deg, #1890ff, #096dd9)',
            border: 'none',
            borderRadius: 6,
            cursor: isLayouting ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            letterSpacing: '0.3px',
          }}
        >
          {isLayouting ? 'Generating...' : 'Generate BPMN'}
        </button>
      </div>
    </div>
  );
}
