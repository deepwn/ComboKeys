/**
 * ComboKeys 类型定义
 * 简洁高效的类型设计
 */

/**
 * 触发回调信息
 */
export interface TriggerInfo {
  /** 原始键盘事件 */
  event: KeyboardEvent;
  /** 实际匹配的按键序列 */
  matched: string[];
  /** 触发次数 */
  triggerCount: number;
  /** 时间戳 */
  timestamp: number;
}

/**
 * ComboKeys 配置选项
 */
export interface ComboKeysOptions {
  /**
   * 按键序列
   * 格式：
   *   - 字符串: "Ctrl+S", "↑↑↓↓BA"
   *   - 数组: ["Ctrl+C", "Ctrl+V"], ["↑", "↓", "←", "→"]
   *   - 混合: ["Ctrl+S", "konami"]
   */
  keys?: string | string[];
  /** 按键间超时时间（毫秒），仅对序列模式有效，默认 1000ms */
  timeout?: number;
  /** 监听目标元素，默认 document */
  target?: Element | Document;
  /** 是否阻止默认行为，默认 true */
  preventDefault?: boolean;
  /** 最大触发次数，默认无限 */
  maxTriggers?: number;
  /** 是否开启调试，默认 false */
  debug?: boolean;
  /** 触发回调函数 */
  callback?: (info: TriggerInfo) => void;
}

/**
 * ComboKeys 状态信息
 */
export interface ComboKeysStatus {
  /** 是否正在监听 */
  isListening: boolean;
  /** 进度，格式 "matched/total" */
  progress: string;
  /** 当前已匹配的按键 */
  currentKeys: string[];
  /** 触发次数 */
  triggerCount: number;
  /** 最大触发次数 */
  maxTriggers: number;
  /** 配置的按键 */
  keys: string[];
  /** 监听目标 */
  target: Element | Document;
  /** 当前模式 */
  mode: 'combo' | 'sequence' | 'mixed';
}

/**
 * 解析后的按键节点
 */
export interface KeyNode {
  /** 按键代码 */
  code: string;
  /** 是否为修饰键 */
  isModifier: boolean;
  /** 是否为按下事件 */
  isKeyDown: boolean;
  /** 子节点（用于多选一） */
  alternatives?: KeyNode[];
}

/**
 * 解析结果
 */
export interface ParseResult {
  /** 解析后的按键节点 */
  nodes: KeyNode[];
  /** 模式：combo-组合键, sequence-序列, mixed-混合 */
  mode: 'combo' | 'sequence' | 'mixed';
  /** 是否有多选一 */
  hasAlternatives: boolean;
}
