import { useState, useCallback, useRef, useEffect } from 'react';
import { useBpmnStore } from '@/store/bpmnStore';
import { saveAiConfig, clearAiConfig, getDefaultModel, getDefaultBaseUrl } from '@/services/aiConfig';
import type { AiProvider } from '@/types/ai';

export function AiPanel() {
  const {
    aiConfig, aiStatus, aiMessages, aiError,
    setAiConfig, parseWithAiAction, clearAiMessages,
  } = useBpmnStore();

  const [userInput, setUserInput] = useState('');
  const [showSettings, setShowSettings] = useState(!aiConfig);
  const [provider, setProvider] = useState<AiProvider>(aiConfig?.provider || 'claude');
  const [apiKey, setApiKey] = useState(aiConfig?.apiKey || '');
  const [model, setModel] = useState(aiConfig?.model || getDefaultModel('claude'));
  const [baseUrl, setBaseUrl] = useState(aiConfig?.baseUrl || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleSaveConfig = useCallback(() => {
    if (!apiKey.trim()) return;
    const config = {
      provider,
      apiKey: apiKey.trim(),
      model: model || getDefaultModel(provider),
      baseUrl: baseUrl.trim() || getDefaultBaseUrl(provider),
    };
    saveAiConfig(config);
    setAiConfig(config);
    setShowSettings(false);
  }, [provider, apiKey, model, baseUrl, setAiConfig]);

  const handleClearConfig = useCallback(() => {
    clearAiConfig();
    setAiConfig(null);
    setApiKey('');
    setShowSettings(true);
  }, [setAiConfig]);

  const handleSubmit = useCallback(() => {
    if (!userInput.trim() || aiStatus === 'parsing') return;
    parseWithAiAction(userInput.trim());
    setUserInput('');
  }, [userInput, aiStatus, parseWithAiAction]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const isParsing = aiStatus === 'parsing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background--surface)' }}>
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-color)' }}>
            🤖 AI 智能建模
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--text-color--disabled)' }}>
            用自然语言描述流程，自动生成 BPMN
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {aiConfig && (
            <button
              onClick={clearAiMessages}
              style={{
                padding: '2px 8px',
                fontSize: 10,
                color: 'var(--text-color--subtler)',
                background: 'var(--background--subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius--3xs)',
                cursor: 'pointer',
              }}
            >
              清空
            </button>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 500,
              color: showSettings ? 'var(--color--purple-600)' : 'var(--text-color--subtler)',
              background: showSettings ? 'var(--color--purple-50)' : 'var(--background--subtle)',
              border: `1px solid ${showSettings ? 'var(--color--purple-200)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius--3xs)',
              cursor: 'pointer',
              transition: 'all var(--duration--snappy)',
            }}
          >
            ⚙ 设置
          </button>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: aiConfig ? 'var(--color--green-500)' : 'var(--color--neutral-300)',
            }}
          />
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: 'var(--background--subtle)' }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-color--subtle)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
              服务商
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['claude', 'openai'] as AiProvider[]).map(p => (
                <button
                  key={p}
                  onClick={() => { setProvider(p); setModel(getDefaultModel(p)); }}
                  style={{
                    flex: 1,
                    padding: '5px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: provider === p ? 'var(--color--purple-600)' : 'var(--text-color--subtle)',
                    background: provider === p ? 'var(--color--purple-50)' : 'var(--background--surface)',
                    border: `1px solid ${provider === p ? 'var(--color--purple-200)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius--3xs)',
                    cursor: 'pointer',
                    transition: 'all var(--duration--snappy)',
                  }}
                >
                  {p === 'claude' ? 'Claude' : 'OpenAI'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-color--subtle)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={provider === 'claude' ? 'sk-ant-...' : 'sk-...'}
              style={{
                width: '100%',
                padding: '5px 8px',
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

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: 'var(--text-color--subtle)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
              模型
            </label>
            <input
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 8px',
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

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--text-color--subtle)', fontWeight: 500, display: 'block', marginBottom: 4 }}>
              Base URL（可选）
            </label>
            <input
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder={`默认: ${getDefaultBaseUrl(provider)}`}
              style={{
                width: '100%',
                padding: '5px 8px',
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

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleSaveConfig}
              disabled={!apiKey.trim()}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                color: '#fff',
                background: apiKey.trim() ? 'linear-gradient(135deg, var(--color--purple-500), var(--color--purple-600))' : 'var(--color--neutral-300)',
                border: 'none',
                borderRadius: 'var(--radius--3xs)',
                cursor: apiKey.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              保存配置
            </button>
            {aiConfig && (
              <button
                onClick={handleClearConfig}
                style={{
                  padding: '6px 12px',
                  fontSize: 11,
                  color: 'var(--color--red-500)',
                  background: 'var(--background--surface)',
                  border: '1px solid var(--color--red-200)',
                  borderRadius: 'var(--radius--3xs)',
                  cursor: 'pointer',
                }}
              >
                清除
              </button>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
        {aiMessages.length === 0 && !showSettings && (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-color--disabled)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
            <div style={{ fontSize: 12, marginBottom: 4 }}>输入自然语言描述，AI 自动生成流程图</div>
            <div style={{ fontSize: 10, color: 'var(--text-color--disabled)', lineHeight: 1.6, marginTop: 12, textAlign: 'left' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-color--subtler)', marginBottom: 4 }}>示例：</div>
              <div style={{ padding: '6px 8px', background: 'var(--background--subtle)', borderRadius: 'var(--radius--3xs)', marginBottom: 4 }}>
                "一个销售审批流程，金额超过10万需要总经理审批，否则部门经理审批即可"
              </div>
              <div style={{ padding: '6px 8px', background: 'var(--background--subtle)', borderRadius: 'var(--radius--3xs)' }}>
                "请假流程：员工提交 → 主管审批，如果超过3天需要HR复核，否则直接通过"
              </div>
            </div>
          </div>
        )}

        {aiMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 8,
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '6px 10px',
                fontSize: 11,
                lineHeight: 1.5,
                borderRadius: 8,
                color: 'var(--text-color)',
                background: msg.role === 'user' ? 'var(--color--purple-50)' : 'var(--background--subtle)',
                border: `1px solid ${msg.role === 'user' ? 'var(--color--purple-200)' : 'var(--border-color--subtle)'}`,
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isParsing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
            <div
              style={{
                padding: '6px 10px',
                fontSize: 11,
                borderRadius: 8,
                background: 'var(--background--subtle)',
                border: '1px solid var(--border-color--subtle)',
                color: 'var(--color--purple-500)',
              }}
            >
              <span style={{ animation: 'pulse 1.2s infinite' }}>AI 正在解析流程...</span>
            </div>
          </div>
        )}

        {aiError && aiStatus === 'error' && !isParsing && (
          <div
            style={{
              padding: '6px 10px',
              fontSize: 11,
              borderRadius: 'var(--radius--2xs)',
              background: 'var(--color--red-50)',
              border: '1px solid var(--color--red-200)',
              color: 'var(--color--red-700)',
              marginBottom: 8,
            }}
          >
            ❌ {aiError}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)' }}>
        {!aiConfig && !showSettings && (
          <div
            style={{
              padding: '8px',
              marginBottom: 6,
              fontSize: 11,
              color: 'var(--color--orange-600)',
              background: 'var(--color--yellow-50)',
              border: '1px solid var(--color--yellow-200)',
              borderRadius: 'var(--radius--3xs)',
              textAlign: 'center',
              cursor: 'pointer',
            }}
            onClick={() => setShowSettings(true)}
          >
            ⚠ 请先点击右上角 ⚙ 配置 API Key
          </div>
        )}
        <textarea
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!aiConfig}
          placeholder={
            aiConfig
              ? '描述你想要的流程...\n例如：员工提交请假申请，主管审批，超过3天需HR复核'
              : '请先配置 API Key...'
          }
          style={{
            width: '100%',
            minHeight: 60,
            maxHeight: 120,
            padding: 8,
            fontSize: 12,
            fontFamily: 'inherit',
            lineHeight: 1.6,
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius--3xs)',
            resize: 'vertical',
            outline: 'none',
            background: aiConfig ? 'var(--background--surface)' : 'var(--background--subtle)',
            color: 'var(--text-color)',
            boxSizing: 'border-box',
            transition: 'border-color var(--duration--snappy)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--color--purple-500)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border-color)')}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 10, color: 'var(--text-color--disabled)' }}>Ctrl+Enter 发送</span>
          <button
            onClick={handleSubmit}
            disabled={!aiConfig || isParsing || !userInput.trim()}
            style={{
              padding: '6px 20px',
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              background: !aiConfig || isParsing || !userInput.trim()
                ? 'var(--color--neutral-300)'
                : 'linear-gradient(135deg, var(--color--purple-500), var(--color--purple-600))',
              border: 'none',
              borderRadius: 'var(--radius--2xs)',
              cursor: !aiConfig || isParsing || !userInput.trim() ? 'not-allowed' : 'pointer',
              transition: 'all var(--duration--snappy)',
            }}
          >
            {isParsing ? '解析中...' : '🤖 AI 生成'}
          </button>
        </div>
      </div>
    </div>
  );
}
