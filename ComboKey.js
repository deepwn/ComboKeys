/**
 * ComboKeys - 优雅的键盘组合键监听器
 * 支持复杂的按键序列检测，如快捷键、秘籍码等
 * 
 * @author ComboKeys
 * @version 2.0.0
 */
class ComboKeys {
    // 静态常量
    static KEY_SYMBOLS = {
        keydown: '+',
        keyup: '-'
    };

    static DEFAULT_OPTIONS = {
        keys: [],
        timeout: 1000,
        target: document,
        preventDefault: true,
        maxTriggers: Infinity,
        debug: false
    };

    /**
     * 创建组合键监听器实例
     * @param {string[]|object} keys - 按键代码数组或配置对象
     * @param {object} options - 配置选项
     */
    constructor(keys = [], options = {}) {
        // 支持两种初始化方式：new ComboKeys(['KeyA']) 或 new ComboKeys({keys: ['KeyA']})
        if (Array.isArray(keys)) {
            this.config = { ...ComboKeys.DEFAULT_OPTIONS, keys, ...options };
        } else {
            this.config = { ...ComboKeys.DEFAULT_OPTIONS, ...keys };
        }

        // 内部状态
        this.state = {
            isListening: false,
            matchedKeys: [],
            lastKeyTime: 0,
            triggerCount: 0,
            eventHandler: null
        };

        // 检测组合键模式：如果包含修饰键，则为组合键模式
        this.isComboMode = this._detectComboMode(this.config.keys);
        
        // 解析按键序列
        this.parsedKeys = this._parseKeySequence(this.config.keys);
        
        // 绑定事件处理器上下文
        this._boundKeyHandler = this._handleKeyEvent.bind(this);
    }

    /**
     * 设置按键组合序列
     * @param {string[]} keys - 按键代码数组
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    keys(keys = []) {
        if (!Array.isArray(keys)) {
            throw new TypeError('按键序列必须是数组类型');
        }
        this.config.keys = keys;
        this.isComboMode = this._detectComboMode(keys);
        this.parsedKeys = this._parseKeySequence(keys);
        this._resetState();
        return this;
    }

    /**
     * 设置按键间超时时间
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    timeout(timeout = 1000) {
        if (typeof timeout !== 'number' || timeout < 0) {
            throw new TypeError('超时时间必须是非负数');
        }
        this.config.timeout = timeout;
        return this;
    }

    /**
     * 设置触发回调函数
     * @param {function} callback - 回调函数
     * @param {boolean} preventDefault - 是否阻止默认行为
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    onTrigger(callback, preventDefault = true) {
        if (typeof callback !== 'function') {
            throw new TypeError('回调函数必须是函数类型');
        }
        this.config.callback = callback;
        this.config.preventDefault = preventDefault;
        return this;
    }

    /**
     * 设置监听目标元素
     * @param {Element} target - 目标DOM元素
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    target(target = document) {
        if (!(target instanceof Element) && target !== document) {
            throw new TypeError('监听目标必须是DOM元素');
        }
        this.config.target = target;
        return this;
    }

    /**
     * 设置最大触发次数
     * @param {number} maxTriggers - 最大触发次数
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    maxTriggers(maxTriggers = Infinity) {
        if (typeof maxTriggers !== 'number' || maxTriggers < 1) {
            throw new TypeError('最大触发次数必须是正整数');
        }
        this.config.maxTriggers = maxTriggers;
        return this;
    }

    /**
     * 开启或关闭调试模式
     * @param {boolean} enabled - 是否开启调试
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    debug(enabled = true) {
        this.config.debug = Boolean(enabled);
        return this;
    }

    /**
     * 开始监听按键事件
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    start() {
        if (this.state.isListening) {
            this._log('警告：监听器已经在运行中');
            return this;
        }

        if (!this.config.callback) {
            throw new Error('请先设置回调函数：.onTrigger(callback)');
        }

        if (this.parsedKeys.length === 0) {
            throw new Error('请先设置按键序列：.keys([...])');
        }

        this._resetState();
        this.state.isListening = true;
        
        // 添加事件监听器
        this.config.target.addEventListener('keydown', this._boundKeyHandler, true);
        this.config.target.addEventListener('keyup', this._boundKeyHandler, true);
        
        this._log(`开始监听组合键: ${this.config.keys.join(' → ')}`);
        return this;
    }

    /**
     * 停止监听按键事件
     * @param {boolean} destroy - 是否销毁实例
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    stop(destroy = false) {
        if (!this.state.isListening) {
            return this;
        }

        // 移除事件监听器
        this.config.target.removeEventListener('keydown', this._boundKeyHandler, true);
        this.config.target.removeEventListener('keyup', this._boundKeyHandler, true);
        
        this.state.isListening = false;
        this._resetState();
        
        if (destroy) {
            this._destroy();
        }
        
        this._log('停止监听组合键');
        return this;
    }

    /**
     * 重置匹配状态
     * @returns {ComboKeys} 返回实例以支持链式调用
     */
    reset() {
        this._resetState();
        this._log('重置匹配状态');
        return this;
    }

    /**
     * 获取当前状态信息
     * @returns {object} 状态信息对象
     */
    getStatus() {
        return {
            isListening: this.state.isListening,
            progress: `${this.state.matchedKeys.length}/${this.parsedKeys.length}`,
            triggerCount: this.state.triggerCount,
            maxTriggers: this.config.maxTriggers,
            keys: [...this.config.keys],
            target: this.config.target
        };
    }

    // === 私有方法 ===

    /**
     * 检测是否为组合键模式
     * @private
     */
    _detectComboMode(keys) {
        const modifierKeys = ['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'];
        return keys.some(key => modifierKeys.includes(key));
    }

    /**
     * 解析按键序列
     * @private
     */
    _parseKeySequence(keys) {
        if (!Array.isArray(keys)) return [];
        
        const parsed = [];
        for (const key of keys) {
            if (typeof key !== 'string') {
                throw new TypeError(`按键代码必须是字符串，获得: ${typeof key}`);
            }
            
            // 如果已经包含前缀符号，直接使用
            if (/^[+-]/.test(key)) {
                parsed.push(key);
            } else {
                if (this.isComboMode) {
                    // 组合键模式：只添加按下事件
                    parsed.push(`+${key}`);
                } else {
                    // 序列模式：添加按下和释放事件
                    parsed.push(`+${key}`, `-${key}`);
                }
            }
        }
        return parsed;
    }

    /**
     * 处理键盘事件
     * @private
     */
    _handleKeyEvent(event) {
        // 忽略重复按键
        if (event.repeat) return;

        const keyCode = ComboKeys.KEY_SYMBOLS[event.type] + event.code;
        this._log(`按键事件: ${keyCode}`, event);

        if (this.isComboMode) {
            // 组合键模式：检测同时按住的按键
            this._handleComboMode(keyCode, event);
        } else {
            // 序列模式：检测按键序列
            this._handleSequenceMode(keyCode, event);
        }
    }

    /**
     * 处理组合键模式（同时按住多个键）
     * @private
     */
    _handleComboMode(keyCode, event) {
        if (event.type === 'keydown') {
            // 检查是否是预期的按键
            if (this.parsedKeys.includes(keyCode)) {
                // 如果还没有开始序列，记录开始时间
                if (this.state.matchedKeys.length === 0) {
                    this.state.lastKeyTime = Date.now();
                }

                // 添加到已匹配的按键列表（如果还没有添加的话）
                if (!this.state.matchedKeys.includes(keyCode)) {
                    this.state.matchedKeys.push(keyCode);
                    this._log(`组合键匹配: ${keyCode}, 进度: ${this.state.matchedKeys.length}/${this.parsedKeys.length}`);
                }

                // 检查是否完成了整个组合键
                if (this.state.matchedKeys.length === this.parsedKeys.length) {
                    // 检查是否所有按键都匹配
                    const allMatched = this.parsedKeys.every(key => this.state.matchedKeys.includes(key));
                    if (allMatched) {
                        this._triggerCallback(event);
                    }
                }
            } else {
                // 如果按下了不在组合键中的按键，重置状态
                if (this.state.matchedKeys.length > 0) {
                    this._log(`按键不匹配: ${keyCode}，重置状态`);
                    this._resetState();
                }
            }
        } else {
            // keyup - 释放按键时从匹配列表中移除
            const pressKeyCode = keyCode.replace('-', '+');
            if (this.state.matchedKeys.includes(pressKeyCode)) {
                const index = this.state.matchedKeys.indexOf(pressKeyCode);
                this.state.matchedKeys.splice(index, 1);
                this._log(`组合键释放: ${keyCode}, 剩余: ${this.state.matchedKeys.length}`);
                
                // 如果所有按键都释放了，稍后重置状态
                if (this.state.matchedKeys.length === 0) {
                    setTimeout(() => {
                        if (this.state.matchedKeys.length === 0) {
                            this._resetState();
                        }
                    }, 50);
                }
            }
        }
    }

    /**
     * 处理序列模式（按顺序按键）
     * @private
     */
    _handleSequenceMode(keyCode, event) {
        // 检查是否匹配下一个预期按键
        const expectedKey = this.parsedKeys[this.state.matchedKeys.length];
        if (expectedKey === keyCode) {
            this.state.matchedKeys.push(keyCode);
            const currentTime = Date.now();

            // 检查超时
            if (this.state.matchedKeys.length > 1) {
                if (currentTime - this.state.lastKeyTime > this.config.timeout) {
                    this._log('按键序列超时，重置状态');
                    this._resetState();
                    return;
                }
            } else {
                this.state.lastKeyTime = currentTime;
            }

            this.state.lastKeyTime = currentTime;
            this._log(`序列匹配: ${keyCode}, 进度: ${this.state.matchedKeys.length}/${this.parsedKeys.length}`);

            // 检查是否完成整个序列
            if (this.state.matchedKeys.length === this.parsedKeys.length) {
                this._triggerCallback(event);
            }
        } else {
            // 序列不匹配，重置状态
            if (this.state.matchedKeys.length > 0) {
                this._log(`序列不匹配: ${keyCode}，重置状态`);
                this._resetState();
            }
        }
    }



    /**
     * 触发回调函数
     * @private
     */
    _triggerCallback(event) {
        this.state.triggerCount++;
        
        if (this.config.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
        }

        this._log(`组合键触发！第 ${this.state.triggerCount} 次`);
        
        // 重置匹配状态
        this._resetState();
        
        // 执行回调
        try {
            this.config.callback.call(this, {
                event,
                triggerCount: this.state.triggerCount,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('ComboKeys 回调函数执行错误:', error);
        }

        // 检查是否达到最大触发次数
        if (this.state.triggerCount >= this.config.maxTriggers) {
            this._log('达到最大触发次数，自动停止监听');
            this.stop();
        }
    }

    /**
     * 重置内部状态
     * @private
     */
    _resetState() {
        this.state.matchedKeys = [];
        this.state.lastKeyTime = 0;
    }

    /**
     * 销毁实例
     * @private
     */
    _destroy() {
        this.state = null;
        this.config = null;
        this.parsedKeys = null;
        this._boundKeyHandler = null;
    }

    /**
     * 调试日志输出
     * @private
     */
    _log(message, ...args) {
        if (this.config.debug) {
            console.log(`[ComboKeys] ${message}`, ...args);
        }
    }
}
