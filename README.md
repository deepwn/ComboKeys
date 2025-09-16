# ComboKeys 2.0

一个现代化、类型安全的 JavaScript 类，用于监听和处理键盘组合键事件。支持复杂的键盘操作序列检测，如快捷键、秘籍码等。

## ✨ 功能特性

- 🎯 **直观易用**：清晰的 API 设计，方法名语义明确
- ⏱️ **超时控制**：可设置按键间的最大时间间隔，超时自动重置
- 👂 **精确监听**：支持指定 DOM 元素监听范围，避免全局污染
- 🔄 **链式调用**：流畅的 API 设计，支持方法链式调用
- 🐛 **调试友好**：内置调试功能，详细的日志输出
- 🚫 **行为控制**：可选择是否阻止浏览器默认行为
- 🔢 **次数限制**：可设置组合键最大触发次数，自动停止
- 📊 **状态监控**：提供实时状态查询接口
- 🛡️ **错误处理**：完善的参数验证和错误提示
- 🧹 **资源管理**：支持优雅的资源清理和销毁

## 🎮 游戏示例

[示例-迷宫逃脱](https://evil7.github.io/ComboKeys/demo.html)

## 🚀 快速开始

### 基本用法

```javascript
// 创建一个监听 Ctrl+C 的组合键
const combo = new ComboKeys(["ControlLeft", "KeyC"])
  .onTrigger(() => {
    console.log("复制快捷键被触发！");
  })
  .start();
```

### 高级用法

```javascript
// 监听复杂的按键序列（科乐美秘籍）
const konamiCode = new ComboKeys(["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"])
  .timeout(800) // 800ms 内完成
  .onTrigger((info) => {
    console.log(`科乐美秘籍激活！第 ${info.triggerCount} 次`);
  }, false) // 不阻止方向键默认行为
  .maxTriggers(3) // 最多触发3次
  .debug(true) // 开启调试模式
  .start();
```

### 配置对象初始化

```javascript
const advancedCombo = new ComboKeys({
  keys: ["AltLeft", "ShiftLeft", "KeyF"],
  timeout: 1500,
  target: document.body,
  preventDefault: true,
  maxTriggers: 5,
  debug: true,
})
  .onTrigger((info) => {
    console.log("高级组合键触发", info);
  })
  .start();
```

### 默认行为控制

```javascript
// 阻止默认行为（默认）
const combo1 = new ComboKeys(["ControlLeft", "KeyS"]).onTrigger(() => console.log("保存")).start();

// 允许默认行为
const combo2 = new ComboKeys(["ControlLeft", "KeyC"])
  .onTrigger(() => console.log("复制"), false) // 第二个参数为false
  .start();

// 输入框中的组合键，通常不阻止默认行为
const inputCombo = new ComboKeys(["ControlLeft", "Enter"])
  .target(document.getElementById("input"))
  .onTrigger(() => console.log("提交"), false)
  .start();
```

## 📚 API 文档

### 构造函数

```javascript
// 方式一：数组 + 选项对象
new ComboKeys(keys, options);

// 方式二：配置对象
new ComboKeys(config);
```

**参数说明:**

- `keys` (Array): 按键代码数组，如 `['ControlLeft', 'KeyC']`
- `options/config` (Object): 配置选项
  - `keys` (Array): 按键序列
  - `timeout` (Number): 按键间超时时间，默认 1000ms
  - `target` (Element): 监听目标，默认 `document`
  - `preventDefault` (Boolean): 是否阻止默认行为，默认 `true`
  - `maxTriggers` (Number): 最大触发次数，默认 `Infinity`
  - `debug` (Boolean): 是否开启调试，默认 `false`

### 核心方法

#### `keys(keyArray)`

设置按键序列

```javascript
combo.keys(["ControlLeft", "KeyC"]);
```

#### `timeout(milliseconds)`

设置按键间超时时间

```javascript
combo.timeout(500); // 设置为500ms
```

#### `onTrigger(callback, preventDefault)`

设置触发回调函数

```javascript
combo.onTrigger((info) => {
  console.log("触发了！", info);
  // info 包含: { event, triggerCount, timestamp }
}, true); // 阻止默认行为（可选，默认true）

// 允许默认行为
combo.onTrigger(callback, false);
```

#### `target(element)`

指定监听目标元素

```javascript
combo.target(document.getElementById("myDiv"));
```

#### `maxTriggers(count)`

设置最大触发次数

```javascript
combo.maxTriggers(3); // 最多触发3次
```

#### `debug(enabled)`

开启或关闭调试模式

```javascript
combo.debug(true); // 输出详细调试信息
```

### 控制方法

#### `start()`

开始监听按键事件

```javascript
combo.start(); // 开始监听
```

#### `stop(destroy)`

停止监听按键事件

```javascript
combo.stop(); // 停止监听
combo.stop(true); // 停止监听并销毁实例
```

#### `reset()`

重置当前匹配状态

```javascript
combo.reset(); // 清除已匹配的按键序列
```

### 状态查询

#### `getStatus()`

获取当前状态信息

```javascript
const status = combo.getStatus();
console.log(status);
// 返回: {
//   isListening: true,
//   progress: "2/4",
//   triggerCount: 1,
//   maxTriggers: 3,
//   keys: ['KeyA', 'KeyB'],
//   target: document
// }
```

## 🏗️ 设计思路与架构

### 核心设计理念

**ComboKeys 2.0** 采用了现代化的面向对象设计，融合了多种设计模式：

#### 1. **事件驱动架构**

- 同时监听 `keydown` 和 `keyup` 事件，提供完整的按键生命周期控制
- 智能模式检测：自动区分组合键模式和序列模式
- 使用事件委托机制，高效处理按键事件

#### 2. **状态机模式**

- 维护清晰的内部状态：`matchedKeys`、`lastKeyTime`、`triggerCount`
- 状态转换逻辑明确：匹配 → 验证超时 → 触发/重置
- 支持组合键和序列键的不同状态管理

#### 3. **建造者模式**

- 流式接口设计，每个配置方法返回 `this`
- 支持链式调用，提供优雅的配置体验
- 灵活的默认行为控制

#### 4. **策略模式**

- 灵活的按键解析策略：支持原始按键码和带前缀的按键码
- 可插拔的事件处理策略
- 组合键模式 vs 序列模式的自适应处理

### 两种工作模式

#### 🔗 组合键模式（同时按住）

当检测到修饰键（Ctrl、Alt、Shift、Meta）时自动启用：

```javascript
// 这些会被识别为组合键模式
["ControlLeft", "KeyC"][("AltLeft", "Tab")][("ControlLeft", "ShiftLeft", "KeyZ")]; // Ctrl+C // Alt+Tab // Ctrl+Shift+Z
```

#### 🔢 序列模式（按顺序按键）

普通按键会被识别为序列模式：

```javascript
// 这些会被识别为序列模式
["KeyH", "KeyE", "KeyL", "KeyL", "KeyO"][("ArrowUp", "ArrowUp", "ArrowDown")][("KeyA", "KeyB", "KeyC")]; // H-E-L-L-O // ↑↑↓ // A-B-C
```

### 按键编码规则

```javascript
// 内部编码规则
{
  keydown: '+',  // 按键按下前缀
  keyup: '-'     // 按键释放前缀
}

// 组合键模式：只监听按下事件
['ControlLeft', 'KeyC'] → ['+ControlLeft', '+KeyC']

// 序列模式：监听按下和释放事件
['KeyA', 'KeyB'] → ['+KeyA', '-KeyA', '+KeyB', '-KeyB']
```

### 错误处理机制

```javascript
// 参数类型验证
if (!Array.isArray(keys)) {
  throw new TypeError("按键序列必须是数组类型");
}

// 运行时错误捕获
try {
  this.config.callback.call(this, info);
} catch (error) {
  console.error("ComboKeys 回调函数执行错误:", error);
}
```

### 内存管理优化

- **智能清理**：`stop(true)` 支持完全销毁实例
- **事件解绑**：使用 `capture: true` 确保事件正确移除
- **状态重置**：提供 `reset()` 方法清理中间状态
- **防内存泄漏**：绑定事件处理器上下文，避免闭包引用

### API 设计原则

#### 1. **直观性**

```javascript
// ❌ 旧版本：方法名不够直观
combo.do(callback).on();

// ✅ 新版本：语义明确
combo.onTrigger(callback).start();
```

#### 2. **一致性**

```javascript
// 所有配置方法都返回 this，支持链式调用
combo.keys([...]).timeout(1000).onTrigger(...).start();
```

#### 3. **容错性**

```javascript
// 重复调用 start() 不会出错
combo.start().start(); // 第二次调用会输出警告但不抛异常
```

#### 4. **可扩展性**

```javascript
// 静态常量便于扩展
static KEY_SYMBOLS = { keydown: '+', keyup: '-' };
static DEFAULT_OPTIONS = { /* ... */ };
```

## 🎯 使用场景

### 游戏开发

```javascript
// 格斗游戏招式系统
const hadoken = new ComboKeys(["ArrowDown", "ArrowRight", "KeyP"])
  .timeout(500)
  .onTrigger(() => this.castFireball(), false) // 允许方向键滚动页面
  .start();
```

### Web 应用快捷键

```javascript
// 编辑器快捷键（通常需要阻止默认行为）
const shortcuts = [
  new ComboKeys(["ControlLeft", "KeyS"]).onTrigger(() => saveDocument()),
  new ComboKeys(["ControlLeft", "KeyZ"]).onTrigger(() => undo()),
  new ComboKeys(["ControlLeft", "ShiftLeft", "KeyZ"]).onTrigger(() => redo()),
].map((combo) => combo.start());
```

### 隐藏功能激活

```javascript
// 开发者工具激活
const devMode = new ComboKeys(["KeyD", "KeyE", "KeyV"])
  .timeout(2000)
  .onTrigger(() => toggleDeveloperMode(), false) // 允许字母输入
  .maxTriggers(1)
  .start();
```

### 安全验证

```javascript
// 管理员面板访问
const adminAccess = new ComboKeys(["KeyA", "KeyD", "KeyM", "KeyI", "KeyN"])
  .timeout(3000)
  .onTrigger(() => showAdminPanel(), false) // 允许正常输入
  .maxTriggers(3)
  .start();
```

## 🎨 最佳实践

### 1. 错误处理

```javascript
try {
  const combo = new ComboKeys(["ControlLeft", "KeyC"]).onTrigger(() => console.log("复制")).start();
} catch (error) {
  console.error("组合键创建失败:", error.message);
}
```

### 2. 默认行为控制

```javascript
// 完全阻止默认行为（默认）
combo.onTrigger(callback);

// 显式阻止默认行为
combo.onTrigger(callback, true);

// 允许默认行为
combo.onTrigger(callback, false);
```

### 3. 资源清理

```javascript
// 页面卸载时清理资源
window.addEventListener("beforeunload", () => {
  comboInstances.forEach((combo) => combo.stop(true));
});
```

### 4. 状态监控

```javascript
// 定期检查组合键状态
setInterval(() => {
  const status = combo.getStatus();
  if (status.progress !== "0/4") {
    console.log(`进度: ${status.progress}`);
  }
}, 1000);
```

### 5. 条件控制

```javascript
// 根据应用状态控制监听
if (isGameMode) {
  gameCombo.start();
} else {
  gameCombo.stop();
}
```

## 🔧 兼容性

| 特性           | 支持情况                                        |
| -------------- | ----------------------------------------------- |
| **浏览器**     | Chrome 51+, Firefox 54+, Safari 10.1+, Edge 79+ |
| **Node.js**    | 不支持（需要 DOM 环境）                         |
| **TypeScript** | 兼容（提供类型推导）                            |
| **ES 模块**    | 支持                                            |
| **CommonJS**   | 支持                                            |

**技术依赖:**

- ✅ 基于标准的 `KeyboardEvent.code` 属性
- ✅ 无外部依赖，纯原生 JavaScript 实现
- ✅ 支持现代 JavaScript 特性（ES6+）

## 📦 安装与导入

```javascript
// ES6 模块
import ComboKeys from "./ComboKey.js";

// CommonJS
const ComboKeys = require("./ComboKey.js");

// 直接引入
<script src="ComboKey.js"></script>;
```

## 🚀 版本更新

### v2.0.0 (当前版本)

- ✨ 全新的 API 设计，更加直观易用
- 🔧 完善的错误处理和参数验证
- 📊 新增状态监控接口
- 🧹 改进的资源管理和内存控制
- 🎯 智能模式检测：自动区分组合键和序列键
- 🛡️ 灵活的默认行为控制：`onTrigger(callback, preventDefault)`
- 📚 详细的文档和示例

### v1.0.0 (旧版本)

- 基础的组合键监听功能
- 简单的链式调用支持

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 可自由使用和修改

---

**ComboKeys 2.0** - _让组合键交互更加优雅_ ⌨️✨
