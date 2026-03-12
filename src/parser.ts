/**
 * ComboKeys 统一解析器
 * 将各种格式的输入解析为统一的按键节点
 */

import { MODIFIER_KEYS } from './constants';
import type { KeyNode, ParseResult } from './types';

// 按键符号映射
const KEY_SYMBOLS: Record<string, string> = {
  '+': 'keydown',
  '-': 'keyup'
};

// 方向键映射
const ARROW_MAP: Record<string, string> = {
  '↑': 'ArrowUp',
  '↓': 'ArrowDown',
  '←': 'ArrowLeft',
  '→': 'ArrowRight',
  'up': 'ArrowUp',
  'down': 'ArrowDown',
  'left': 'ArrowLeft',
  'right': 'ArrowRight'
};

// 修饰键别名映射
const MODIFIER_ALIASES: Record<string, string[]> = {
  'ctrl': ['ControlLeft', 'ControlRight'],
  'control': ['ControlLeft', 'ControlRight'],
  'alt': ['AltLeft', 'AltRight'],
  'shift': ['ShiftLeft', 'ShiftRight'],
  'meta': ['MetaLeft', 'MetaRight'],
  'win': ['MetaLeft', 'MetaRight'],
  'cmd': ['MetaLeft', 'MetaRight'],
  'command': ['MetaLeft', 'MetaRight']
};

/**
 * 解析输入配置
 * @param keys 支持的格式：
 * - 字符串: "Ctrl+S", "↑↑↓↓BA", "konami"
 * - 数组: ["Ctrl+C", "Ctrl+V"], [["Ctrl", "K"], "S"]
 * - 嵌套数组: [["Ctrl+C", "Ctrl+V"], "konami"]
 */
export function parseKeys(keys: string | string[]): ParseResult {
  // 处理字符串输入
  if (typeof keys === 'string') {
    return parseString(keys);
  }

  // 处理数组输入 - 可能是多选一或多个快捷键
  const allNodes: KeyNode[] = [];
  let hasAlternatives = false;
  let hasMultipleKeys = false;

  // 检查是否为多选一格式 [[A, B], C]
  const hasNestedArray = keys.some(k => Array.isArray(k));
  
  if (hasNestedArray) {
    // 多选一模式: [["Ctrl+C", "Ctrl+V"], "Ctrl+X"]
    hasAlternatives = true;
    
    for (const item of keys) {
      if (Array.isArray(item)) {
        // 多选一: [A, B, C] - 任意一个匹配即可
        const altNodes: KeyNode[] = [];
        for (const subItem of item) {
          const result = parseString(String(subItem));
          altNodes.push(...result.nodes);
        }
        if (altNodes.length > 0) {
          // 将多选一的第一组作为主节点，添加 alternatives
          const mainNode = { ...altNodes[0], alternatives: altNodes };
          allNodes.push(mainNode);
        }
      } else {
        const result = parseString(String(item));
        allNodes.push(...result.nodes);
      }
    }
  } else {
    // 多个独立快捷键: ["Ctrl+C", "Ctrl+V"]
    if (keys.length > 1) {
      hasMultipleKeys = true;
    }
    
    for (const item of keys) {
      const result = parseString(String(item));
      allNodes.push(...result.nodes);
    }
  }

  // 检测模式
  const mode = detectMode(allNodes);

  return {
    nodes: allNodes,
    mode: hasAlternatives ? 'mixed' : (hasMultipleKeys ? 'mixed' : mode),
    hasAlternatives
  };
}

/**
 * 解析字符串格式
 * 支持: "Ctrl+S", "↑↑↓↓BA"
 */
function parseString(input: string): ParseResult {
  const nodes: KeyNode[] = [];
  
  // 1. 处理方向键序列 (↑↑↓↓←→)
  if (/^[↑↓←→]+$/i.test(input)) {
    for (const char of input) {
      const code = ARROW_MAP[char.toLowerCase()];
      if (code) {
        // 序列模式只需要 keydown
        nodes.push({
          code: '+' + code,
          isModifier: false,
          isKeyDown: true
        });
      }
    }
    return {
      nodes,
      mode: 'sequence',
      hasAlternatives: false
    };
  }

  // 3. 处理 Ctrl+Shift+K 格式
  if (input.includes('+')) {
    const parts = input.split('+');
    const isCombo = parts.length > 1;
    
    for (const part of parts) {
      const code = resolveKeyCode(part.trim());
      if (!code) continue;
      
      const isMod = isModifierKey(code);
      
      // 组合键模式: +Ctrl, +Shift, +KeyK
      nodes.push({
        code: '+' + code,
        isModifier: isMod,
        isKeyDown: true
      });
    }
    
    return {
      nodes,
      mode: isCombo ? 'combo' : 'sequence',
      hasAlternatives: false
    };
  }

  // 4. 处理纯字母序列 (如: idkfa, konami)
  if (/^[a-zA-Z]+$/.test(input)) {
    for (const char of input.toUpperCase()) {
      const code = 'Key' + char;
      // 序列模式只需要 keydown
      nodes.push({
        code: '+' + code,
        isModifier: false,
        isKeyDown: true
      });
    }
    return {
      nodes,
      mode: 'sequence',
      hasAlternatives: false
    };
  }

  // 5. 处理混合序列 (方向键 + 字母，如: ↑↑↓↓←→←→BA)
  if (/^[↑↓←→a-zA-Z]+$/i.test(input)) {
    for (const char of input) {
      let code: string | null = null;
      
      // 检查是否是方向键
      if ('↑↓←→'.includes(char)) {
        code = ARROW_MAP[char.toLowerCase()];
      } else if (/[a-zA-Z]/.test(char)) {
        // 字母
        code = 'Key' + char.toUpperCase();
      }
      
      if (code) {
        nodes.push({
          code: '+' + code,
          isModifier: false,
          isKeyDown: true
        });
      }
    }
    
    if (nodes.length > 0) {
      return {
        nodes,
        mode: 'sequence',
        hasAlternatives: false
      };
    }
  }

  // 5. 处理 F1-F12 范围
  if (/^F\d+(?:-\d+)?$/i.test(input)) {
    const match = input.match(/^F(\d+)(?:-F?(\d+))?$/i);
    if (match) {
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : start;
      
      for (let i = start; i <= end; i++) {
        const code = 'F' + i;
        // 序列模式只需要 keydown
        nodes.push({
          code: '+' + code,
          isModifier: false,
          isKeyDown: true
        });
      }
    }
    return {
      nodes,
      mode: 'sequence',
      hasAlternatives: false
    };
  }

  // 6. 尝试作为单个按键处理
  const code = resolveKeyCode(input);
  if (code) {
    // 序列模式只需要 keydown
    nodes.push({
      code: '+' + code,
      isModifier: isModifierKey(code),
      isKeyDown: true
    });
  }

  return {
    nodes,
    mode: detectMode(nodes),
    hasAlternatives: false
  };
}

/**
 * 解析按键代码
 * 处理各种格式的输入，返回标准化的 KeyCode
 */
function resolveKeyCode(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  
  if (!trimmed) return null;
  
  // 方向键
  if (ARROW_MAP[trimmed]) {
    return ARROW_MAP[trimmed];
  }
  
  // 修饰键别名
  if (MODIFIER_ALIASES[trimmed]) {
    // 返回第一个匹配的修饰键
    return MODIFIER_ALIASES[trimmed][0];
  }
  
  // 特殊键
  const SPECIAL_KEYS: Record<string, string> = {
    'space': 'Space',
    'enter': 'Enter',
    'tab': 'Tab',
    'esc': 'Escape',
    'escape': 'Escape',
    'backspace': 'Backspace',
    'delete': 'Delete',
    'insert': 'Insert',
    'home': 'Home',
    'end': 'End',
    'pageup': 'PageUp',
    'pagedown': 'PageDown'
  };
  
  if (SPECIAL_KEYS[trimmed]) {
    return SPECIAL_KEYS[trimmed];
  }
  
  // 功能键 F1-F12
  if (/^f\d+$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  
  // 字母键 A-Z
  if (/^[a-z]$/.test(trimmed)) {
    return 'Key' + trimmed.toUpperCase();
  }
  
  // 数字键 0-9
  if (/^\d$/.test(trimmed)) {
    return 'Digit' + trimmed;
  }
  
  // 已经标准化的 KeyCode
  if (trimmed.startsWith('key')) {
    return trimmed.toUpperCase();
  }
  
  return trimmed;
}

/**
 * 判断是否为修饰键
 */
function isModifierKey(code: string): boolean {
  return MODIFIER_KEYS.includes(code as typeof MODIFIER_KEYS[number]);
}

/**
 * 检测模式
 */
function detectMode(nodes: KeyNode[]): 'combo' | 'sequence' | 'mixed' {
  if (nodes.length === 0) return 'sequence';
  
  const hasModifier = nodes.some(n => n.isModifier);
  const hasSequence = nodes.length > 1 && !hasModifier;
  
  if (hasModifier) return 'combo';
  if (hasSequence) return 'sequence';
  
  return 'sequence';
}

/**
 * 格式化按键显示
 */
export function formatKeyDisplay(code: string): string {
  // 移除前缀
  const key = code.replace(/^[+-]/, '');
  
  // 映射显示
  const DISPLAY_MAP: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ControlLeft': 'Ctrl',
    'ControlRight': 'Ctrl',
    'AltLeft': 'Alt',
    'AltRight': 'Alt',
    'ShiftLeft': 'Shift',
    'ShiftRight': 'Shift',
    'MetaLeft': 'Win',
    'MetaRight': 'Win',
    'Space': 'Space',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Escape': 'Esc',
    'Backspace': 'Backspace',
    'Delete': 'Del'
  };
  
  if (DISPLAY_MAP[key]) {
    return DISPLAY_MAP[key];
  }
  
  // 字母键
  if (key.startsWith('Key')) {
    return key.slice(3);
  }
  
  // 数字键
  if (key.startsWith('Digit')) {
    return key.slice(5);
  }
  
  return key;
}

/**
 * 获取按键列表的字符串表示
 */
export function keysToString(keys: string[]): string {
  return keys.map(k => formatKeyDisplay(k)).join(' + ');
}
