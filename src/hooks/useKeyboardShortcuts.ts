/**
 * useKeyboardShortcuts - Keyboard shortcuts support
 *
 * Provides keyboard shortcuts for common actions
 */

import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
        const metaMatch = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

// Common shortcuts presets
export const COMMON_SHORTCUTTS = {
  save: { key: 's', ctrlKey: true, description: '保存项目' },
  export: { key: 'e', ctrlKey: true, description: '导出报告' },
  aiChat: { key: 'i', ctrlKey: true, description: '打开AI助手' },
  calculate: { key: 'Enter', ctrlKey: true, description: '重新计算' },
  help: { key: '?', description: '显示快捷键' },
  newProject: { key: 'n', ctrlKey: true, description: '新建项目' },
  compare: { key: 'c', ctrlKey: true, description: '项目对比' },
};

export default useKeyboardShortcuts;
