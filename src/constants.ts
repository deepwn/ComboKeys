/**
 * ComboKeys 常量定义
 */

// 事件类型符号
export const KEY_SYMBOLS = {
  keydown: '+',
  keyup: '-'
} as const;

// 修饰键列表
export const MODIFIER_KEYS = [
  'ControlLeft', 'ControlRight',
  'AltLeft', 'AltRight',
  'ShiftLeft', 'ShiftRight',
  'MetaLeft', 'MetaRight'
] as const;

// 修饰键对称对
export const MODIFIER_PAIRS = {
  'Control': ['ControlLeft', 'ControlRight'],
  'Alt': ['AltLeft', 'AltRight'],
  'Shift': ['ShiftLeft', 'ShiftRight'],
  'Meta': ['MetaLeft', 'MetaRight']
} as const;

// 默认配置
export const DEFAULT_OPTIONS = {
  keys: [] as string[],
  timeout: 1000,
  target: document,
  preventDefault: true,
  maxTriggers: Infinity,
  debug: false
} as const;
