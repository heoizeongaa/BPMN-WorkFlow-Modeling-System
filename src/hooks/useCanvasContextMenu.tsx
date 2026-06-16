import { useState, useCallback, useEffect, useRef } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'node' | 'edge' | 'pane';
  nodeId?: string;
  edgeId?: string;
}

/**
 * 画布右键菜单 + 快捷操作 Hook
 */
export function useCanvasContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, type: 'pane',
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();

  const showContextMenu = useCallback((event: React.MouseEvent, type: 'node' | 'edge' | 'pane', id?: string) => {
    event.preventDefault();
    event.stopPropagation();

    const container = (event.currentTarget as HTMLElement).closest('.react-flow');
    if (!container) return;
    const rect = container.getBoundingClientRect();

    setMenu({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      type,
      nodeId: type === 'node' ? id : undefined,
      edgeId: type === 'edge' ? id : undefined,
    });
  }, []);

  const hideContextMenu = useCallback(() => {
    setMenu(prev => ({ ...prev, visible: false }));
  }, []);

  // 点击其他地方关闭菜单
  useEffect(() => {
    if (!menu.visible) return;
    const handler = () => hideContextMenu();
    window.addEventListener('click', handler);
    window.addEventListener('contextmenu', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('contextmenu', handler);
    };
  }, [menu.visible, hideContextMenu]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nodes => nodes.filter(n => n.id !== nodeId));
    setEdges(edges => edges.filter(e => e.source !== nodeId && e.target !== nodeId));
    hideContextMenu();
  }, [setNodes, setEdges, hideContextMenu]);

  const deleteEdge = useCallback((edgeId: string) => {
    setEdges(edges => edges.filter(e => e.id !== edgeId));
    hideContextMenu();
  }, [setEdges, hideContextMenu]);

  const duplicateNode = useCallback((nodeId: string) => {
    const nodes = getNodes();
    const original = nodes.find(n => n.id === nodeId);
    if (!original) return;

    const newId = `${original.type}_copy_${Date.now().toString(36)}`;
    const newNode: Node = {
      ...original,
      id: newId,
      position: { x: original.position.x + 40, y: original.position.y + 40 },
      selected: false,
    };
    setNodes(nodes => [...nodes, newNode]);
    hideContextMenu();
  }, [getNodes, setNodes, hideContextMenu]);

  return {
    contextMenu: menu,
    showContextMenu,
    hideContextMenu,
    deleteNode,
    deleteEdge,
    duplicateNode,
    menuRef,
  };
}

/**
 * 右键菜单渲染组件
 */
export function ContextMenuOverlay({
  menu,
  menuRef,
  onDeleteNode,
  onDeleteEdge,
  onDuplicateNode,
  onClose,
}: {
  menu: ContextMenuState;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onDuplicateNode: (id: string) => void;
  onClose: () => void;
}) {
  if (!menu.visible) return null;

  const itemStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--text-color)',
    transition: 'background 0.1s',
    borderRadius: 4,
    margin: '2px 4px',
  };

  const dangerStyle: React.CSSProperties = {
    ...itemStyle,
    color: 'var(--color--red-500)',
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        left: menu.x,
        top: menu.y,
        zIndex: 1000,
        background: 'var(--background--surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius--xs)',
        boxShadow: 'var(--shadow--md)',
        padding: '4px 0',
        minWidth: 160,
        animation: 'fadeIn 0.1s ease',
      }}
      onContextMenu={e => e.preventDefault()}
    >
      {menu.type === 'node' && menu.nodeId && (
        <>
          <div
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--background--hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => onDuplicateNode(menu.nodeId!)}
          >
            📋 复制节点
          </div>
          <div style={{ height: 1, background: 'var(--border-color--subtle)', margin: '4px 8px' }} />
          <div
            style={dangerStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color--red-50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => onDeleteNode(menu.nodeId!)}
          >
            🗑️ 删除节点
          </div>
        </>
      )}

      {menu.type === 'edge' && menu.edgeId && (
        <>
          <div
            style={itemStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--background--hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={onClose}
          >
            ✏️ 编辑条件（左侧面板）
          </div>
          <div style={{ height: 1, background: 'var(--border-color--subtle)', margin: '4px 8px' }} />
          <div
            style={dangerStyle}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color--red-50)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            onClick={() => onDeleteEdge(menu.edgeId!)}
          >
            🗑️ 删除连线
          </div>
        </>
      )}

      {menu.type === 'pane' && (
        <div style={{ ...itemStyle, color: 'var(--text-color--disabled)', cursor: 'default', fontSize: 11 }}>
          右键节点或连线进行操作
        </div>
      )}
    </div>
  );
}
