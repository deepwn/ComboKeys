/**
 * ComboKeys - 优雅的键盘组合键监听器
 * 支持复杂的按键序列检测，如快捷键、秘籍码等
 * 
 * @author ComboKeys
 * @version 2.1.0
 */

import { KEY_SYMBOLS, MODIFIER_KEYS, DEFAULT_OPTIONS } from './constants';
import { parseKeys, keysToString } from './parser';
import type { 
  ComboKeysOptions, 
  ComboKeysStatus, 
  TriggerInfo,
  KeyNode,
  ParseResult 
} from './types';

// 虚拟键盘状态表：全局共享，记录按键是否按下 (0=未按下, 1=按下)
const keyboardState: Record<string, 0 | 1> = {};

/**
 * 更新虚拟键盘状态
 */
function updateKeyboardState(code: string, pressed: 0 | 1): void {
  keyboardState[code] = pressed;
}

/**
 * 检查按键是否按下
 */
function isKeyPressed(code: string): boolean {
  return keyboardState[code] === 1;
}

/**
 * 检查对称修饰键组是否按下（如 ControlLeft 或 ControlRight）
 */
function isModifierGroupPressed(modifierGroup: readonly string[]): boolean {
  return modifierGroup.some(code => keyboardState[code] === 1);
}

interface InternalState {
  isListening: boolean;
  matchedNodes: KeyNode[];
  lastKeyTime: number;
  triggerCount: number;
}

class ComboKeys {
  // ==================== 静态常量（向后兼容） ====================
  static readonly KEY_SYMBOLS = KEY_SYMBOLS;
  static readonly MODIFIER_KEYS = MODIFIER_KEYS;

  // ==================== 静态属性（按键快捷访问） ====================
  static readonly A = 'KeyA';
  static readonly B = 'KeyB';
  static readonly C = 'KeyC';
  static readonly D = 'KeyD';
  static readonly E = 'KeyE';
  static readonly F = 'KeyF';
  static readonly G = 'KeyG';
  static readonly H = 'KeyH';
  static readonly I = 'KeyI';
  static readonly J = 'KeyJ';
  static readonly K = 'KeyK';
  static readonly L = 'KeyL';
  static readonly M = 'KeyM';
  static readonly N = 'KeyN';
  static readonly O = 'KeyO';
  static readonly P = 'KeyP';
  static readonly Q = 'KeyQ';
  static readonly R = 'KeyR';
  static readonly S = 'KeyS';
  static readonly T = 'KeyT';
  static readonly U = 'KeyU';
  static readonly V = 'KeyV';
  static readonly W = 'KeyW';
  static readonly X = 'KeyX';
  static readonly Y = 'KeyY';
  static readonly Z = 'KeyZ';

  static readonly F1 = 'F1';
  static readonly F2 = 'F2';
  static readonly F3 = 'F3';
  static readonly F4 = 'F4';
  static readonly F5 = 'F5';
  static readonly F6 = 'F6';
  static readonly F7 = 'F7';
  static readonly F8 = 'F8';
  static readonly F9 = 'F9';
  static readonly F10 = 'F10';
  static readonly F11 = 'F11';
  static readonly F12 = 'F12';

  static readonly Ctrl = ['ControlLeft', 'ControlRight'] as const;
  static readonly Control = ['ControlLeft', 'ControlRight'] as const;
  static readonly Alt = ['AltLeft', 'AltRight'] as const;
  static readonly Shift = ['ShiftLeft', 'ShiftRight'] as const;
  static readonly Meta = ['MetaLeft', 'MetaRight'] as const;
  static readonly Win = ['MetaLeft', 'MetaRight'] as const;
  static readonly Cmd = ['MetaLeft', 'MetaRight'] as const;

  static readonly Up = 'ArrowUp';
  static readonly Down = 'ArrowDown';
  static readonly Left = 'ArrowLeft';
  static readonly Right = 'ArrowRight';

  static readonly Space = 'Space';
  static readonly Enter = 'Enter';
  static readonly Tab = 'Tab';
  static readonly Escape = 'Escape';
  static readonly Backspace = 'Backspace';
  static readonly Delete = 'Delete';

  // ==================== 实例属性 ====================
  private config: Required<ComboKeysOptions> & { target: Element | Document; callback: (info: TriggerInfo) => void };
  private state: InternalState;
  private parseResult: ParseResult;
  private _boundKeyHandler: (e: Event) => void;

  // ==================== 构造函数 ====================
  /**
   * 创建 ComboKeys 实例
   * @param keys 按键配置，支持字符串 "Ctrl+S"、数组 ["Ctrl+C", "Ctrl+V"]、别名 "konami"
   * @param options 配置选项
   */
  constructor(keys?: string | string[], options?: ComboKeysOptions) {
    // 简化版：第一个参数是字符串或数组，第二个参数是选项
    const keysInput = (typeof keys === 'string' || Array.isArray(keys)) ? keys : [];
    const optsInput = options || {};

    this.config = {
      ...DEFAULT_OPTIONS,
      ...optsInput,
      keys: keysInput,
      target: optsInput?.target || document,
      callback: optsInput?.callback || (() => {})
    } as typeof this.config;

    // 解析按键
    this.parseResult = parseKeys(this.config.keys);

    // 内部状态
    this.state = {
      isListening: false,
      matchedNodes: [],
      lastKeyTime: 0,
      triggerCount: 0
    };

    // 绑定事件处理器
    this._boundKeyHandler = (e: Event) => this._handleKeyEvent(e as KeyboardEvent);
  }

  // ==================== 链式配置方法 ====================
  
  /**
   * 设置按键组合序列
   */
  keys(keys: string | string[]): this {
    this.config.keys = keys;
    this.parseResult = parseKeys(keys);
    this._resetState();
    return this;
  }

  /**
   * 设置按键间超时时间
   */
  timeout(timeout: number): this {
    this.config.timeout = Math.max(0, timeout);
    return this;
  }

  /**
   * 设置触发回调函数
   */
  onTrigger(callback: (info: TriggerInfo) => void, preventDefault: boolean = true): this {
    this.config.callback = callback;
    this.config.preventDefault = preventDefault;
    return this;
  }

  /**
   * 设置监听目标元素
   */
  target(target: Element | Document): this {
    this.config.target = target;
    return this;
  }

  /**
   * 设置最大触发次数
   */
  maxTriggers(maxTriggers: number): this {
    this.config.maxTriggers = Math.max(1, maxTriggers);
    return this;
  }

  /**
   * 开启或关闭调试模式
   */
  debug(enabled: boolean = true): this {
    this.config.debug = Boolean(enabled);
    return this;
  }

  // ==================== 控制方法 ====================

  /**
   * 开始监听按键事件
   */
  start(): this {
    if (this.state.isListening) {
      this._log('⚠️ 监听器已在运行');
      return this;
    }

    if (this.parseResult.nodes.length === 0) {
      throw new Error('请先设置按键序列：.keys("Ctrl+S")');
    }

    this._resetState();
    this.state.isListening = true;
    
    this.config.target.addEventListener('keydown', this._boundKeyHandler, true);
    this.config.target.addEventListener('keyup', this._boundKeyHandler, true);
    
    this._log(`🎧 开始监听: ${keysToString(this._getKeyCodes())}`);
    return this;
  }

  /**
   * 停止监听按键事件
   */
  stop(destroy: boolean = false): this {
    if (!this.state.isListening) return this;

    this.config.target.removeEventListener('keydown', this._boundKeyHandler, true);
    this.config.target.removeEventListener('keyup', this._boundKeyHandler, true);
    
    this.state.isListening = false;
    this._resetState();
    
    if (destroy) {
      this._destroy();
    }
    
    this._log('⏹️ 停止监听');
    return this;
  }

  /**
   * 重置匹配状态
   */
  reset(): this {
    this._resetState();
    return this;
  }

  /**
   * 获取当前状态信息
   */
  getStatus(): ComboKeysStatus {
    return {
      isListening: this.state.isListening,
      progress: `${this.state.matchedNodes.length}/${this.parseResult.nodes.length}`,
      currentKeys: this._getMatchedKeyCodes(),
      triggerCount: this.state.triggerCount,
      maxTriggers: this.config.maxTriggers,
      keys: this.config.keys as string[],
      target: this.config.target,
      mode: this.parseResult.mode
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 获取按键代码列表
   */
  private _getKeyCodes(): string[] {
    return this.parseResult.nodes.map(n => n.code);
  }

  /**
   * 获取已匹配的按键代码
   */
  private _getMatchedKeyCodes(): string[] {
    return this.state.matchedNodes.map(n => n.code);
  }

  /**
   * 处理键盘事件
   */
  private _handleKeyEvent(event: KeyboardEvent): void {
    if (event.repeat) return;

    // 更新虚拟键盘状态
    const pressed = event.type === 'keydown' ? 1 : 0;
    updateKeyboardState(event.code, pressed);

    const keyCode = KEY_SYMBOLS[event.type === 'keydown' ? 'keydown' : 'keyup'] + event.code;
    this._log(`⌨️ ${event.type}: ${event.code} (状态: ${pressed})`);

    // 组合键模式
    if (this.parseResult.mode === 'combo') {
      this._handleComboMode(keyCode, event);
    } else {
      // 序列模式：只处理 keydown，忽略 keyup
      if (event.type === 'keydown') {
        this._handleSequenceMode(keyCode, event);
      }
    }
  }

  /**
   * 处理组合键模式（粘滞模式）
   * 核心逻辑：通过虚拟键盘表检查所有目标按键是否同时按下
   */
  private _handleComboMode(keyCode: string, event: KeyboardEvent): void {
    // 组合键模式只在 keydown 时检测
    if (event.type !== 'keydown') {
      // keyup 时如果所有按键都释放了，重置状态
      if (this._allKeysReleased()) {
        this._resetState();
      }
      return;
    }

    // 获取目标按键列表（去掉 + 前缀）
    const targetCodes = this._getKeyCodes().map(code => code.replace('+', ''));
    
    this._log(`🔍 检查 keyCode: ${event.code}, 目标: ${targetCodes}`);

    // 检查所有目标按键是否都按下（通过虚拟键盘表）
    const allPressed = this._checkAllKeysPressed(targetCodes);
    this._log(`📊 虚拟键盘状态: ${JSON.stringify(keyboardState)}, 全部按下: ${allPressed}`);

    if (allPressed) {
      // 所有按键都按下时，添加所有匹配的节点
      targetCodes.forEach(code => {
        const nodeCode = '+' + code;
        const matchedNode = this.parseResult.nodes.find(n => n.code === nodeCode);
        if (matchedNode && !this.state.matchedNodes.some(n => n.code === nodeCode)) {
          this.state.matchedNodes.push(matchedNode);
        }
      });

      // 检查是否全部匹配
      if (this.state.matchedNodes.length === targetCodes.length) {
        this._triggerCallback(event);
        // 触发后重置
        this._resetState();
      }
    }
  }

  /**
   * 检查所有目标按键是否都按下
   */
  private _checkAllKeysPressed(targetCodes: string[]): boolean {
    return targetCodes.every(code => {
      // 检查是否为修饰键组
      if (code === 'ControlLeft' || code === 'ControlRight') {
        return isModifierGroupPressed(['ControlLeft', 'ControlRight']);
      }
      if (code === 'AltLeft' || code === 'AltRight') {
        return isModifierGroupPressed(['AltLeft', 'AltRight']);
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight') {
        return isModifierGroupPressed(['ShiftLeft', 'ShiftRight']);
      }
      if (code === 'MetaLeft' || code === 'MetaRight') {
        return isModifierGroupPressed(['MetaLeft', 'MetaRight']);
      }
      // 普通按键直接检查
      return isKeyPressed(code);
    });
  }

  /**
   * 检查是否所有按键都释放了
   */
  private _allKeysReleased(): boolean {
    const targetCodes = this._getKeyCodes().map(code => code.replace('+', ''));
    return targetCodes.every(code => !isKeyPressed(code));
  }

  /**
   * 处理序列模式（顺序按键触发）
   */
  private _handleSequenceMode(keyCode: string, event: KeyboardEvent): void {
    const expectedNode = this.parseResult.nodes[this.state.matchedNodes.length];
    
    if (!expectedNode) return;

    // 检查超时
    const now = Date.now();
    if (this.state.matchedNodes.length > 0 && now - this.state.lastKeyTime > this.config.timeout) {
      this._log('⏱️ 序列超时，重置');
      this._resetState();
    }

    // 匹配检查
    if (expectedNode.code === keyCode) {
      this.state.matchedNodes.push(expectedNode);
      this.state.lastKeyTime = now;
      
      this._log(`✅ 匹配: ${expectedNode.code} (${this.state.matchedNodes.length}/${this.parseResult.nodes.length})`);

      // 检查是否完成
      if (this.state.matchedNodes.length === this.parseResult.nodes.length) {
        this._triggerCallback(event);
      }
    } else {
      // 不匹配，检查是否需要重置
      if (this.state.matchedNodes.length > 0) {
        // 检查是否有部分匹配（允许重新开始）
        const partialMatch = this.parseResult.nodes.findIndex((n, i) => 
          i < this.state.matchedNodes.length && n.code === keyCode
        );
        
        if (partialMatch === -1) {
          this._log(`❌ 不匹配: ${keyCode}，重置`);
          this._resetState();
        }
      }
    }
  }

  /**
   * 触发回调函数
   */
  private _triggerCallback(event: KeyboardEvent): void {
    this.state.triggerCount++;
    
    if (this.config.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    }

    this._log(`🎉 触发！第 ${this.state.triggerCount} 次`);
    
    // 执行回调
    try {
      this.config.callback({
        event,
        matched: this._getMatchedKeyCodes(),
        triggerCount: this.state.triggerCount,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('ComboKeys 回调错误:', error);
    }

    // 重置状态（序列模式）
    if (this.parseResult.mode === 'sequence') {
      this._resetState();
    }

    // 检查最大触发次数
    if (this.state.triggerCount >= this.config.maxTriggers) {
      this._log('🔚 达到最大触发次数');
      this.stop();
    }
  }

  /**
   * 重置内部状态
   */
  private _resetState(): void {
    this.state.matchedNodes = [];
    this.state.lastKeyTime = 0;
  }

  /**
   * 销毁实例
   */
  private _destroy(): void {
    this.state = {
      isListening: false,
      matchedNodes: [],
      lastKeyTime: 0,
      triggerCount: 0
    };
    this.parseResult = { nodes: [], mode: 'sequence', hasAlternatives: false };
    this._boundKeyHandler = () => {};
  }

  /**
   * 调试日志输出
   */
  private _log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[ComboKeys] ${message}`, ...args);
    }
  }
}

export { ComboKeys };
export default ComboKeys;
