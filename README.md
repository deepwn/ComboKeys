# ComboKeys 2.1

一个现代化、类型安全的 JavaScript 类，用于监听和处理键盘组合键和序列键事件。支持**同时按键触发**和**顺序按键触发**两种模式。

可用于 Web 应用快捷键、游戏操作、隐藏功能激活等场景。

## ✨ 功能特性

- 🎯 **双模式支持**：同时支持组合键（Ctrl+C）和序列键（↑↑↓↓←→BA）
- 🔗 **组合键触发**：修饰键+普通键同时按下时立即触发
- 🔢 **序列键触发**：按键按顺序输入后触发
- 👂 **精确监听**：支持指定 DOM 元素监听范围，避免全局污染
- 🔄 **链式调用**：流畅的 API 设计，支持方法链式调用
- 🐛 **调试友好**：内置调试功能，详细的日志输出
- 🚫 **行为控制**：可选择是否阻止浏览器默认行为
- 🔢 **次数限制**：可设置组合键最大触发次数，自动停止
- 📊 **状态监控**：提供实时状态查询接口
- 🛡️ **错误处理**：完善的参数验证和错误提示
- 🧹 **资源管理**：支持优雅的资源清理和销毁

## 🎮 示例

[在线演示](https://evil7.github.io/ComboKeys/demo.html)

## 🚀 快速开始

### 组合键模式（同时按下）

```javascript
// 监听 Ctrl+C 组合键（同时按下触发）
const combo = new ComboKeys("Ctrl+C")
  .onTrigger(() => {
    console.log("复制快捷键被触发！");
  })
  .start();

// 多键组合 - Ctrl+Alt+Shift+A
const combo4 = new ComboKeys("Ctrl+Alt+Shift+A").onTrigger(() => console.log("四键组合触发！")).start();
```

### 序列模式（按顺序输入）

```javascript
// 监听按键序列（按顺序输入后触发）
const konamiCode = new ComboKeys("↑↑↓↓←→←→BA")
  .timeout(1500) // 1500ms 内完成输入
  .onTrigger((info) => {
    console.log(`科乐美秘籍激活！第 ${info.triggerCount} 次`);
  }, false) // 不阻止默认行为
  .maxTriggers(3) // 最多触发3次
  .debug(true) // 开启调试
  .start();
```

### 初始化方式

```javascript
// 方式一：直接传入字符串（推荐）
new ComboKeys("Ctrl+S").onTrigger(() => console.log("保存")).start();

// 方式二：数组形式
new ComboKeys(["Ctrl", "S"]).onTrigger(() => console.log("保存")).start();

// 方式三：配置对象
new ComboKeys({
  keys: "Ctrl+Shift+P",
  timeout: 1000,
  target: document.body,
  preventDefault: true,
  maxTriggers: Infinity,
  debug: false,
  callback: () => console.log("触发"),
}).start();
```

### 默认行为控制

```javascript
// 阻止默认行为（默认）
const combo1 = new ComboKeys("Ctrl+S").onTrigger(() => console.log("保存")).start();

// 允许默认行为
const combo2 = new ComboKeys("Ctrl+C").onTrigger(() => console.log("复制"), false).start();

// 输入框中的组合键，通常不阻止默认行为
const inputCombo = new ComboKeys("Ctrl+Enter")
  .target(document.getElementById("input"))
  .onTrigger(() => console.log("提交"), false)
  .start();
```

## 📚 API 文档

### 构造函数

```javascript
// 方式一：字符串（推荐）
new ComboKeys("Ctrl+C");

// 方式二：数组
new ComboKeys(["Ctrl", "C"]);

// 方式三：配置对象
new ComboKeys({
  keys: "Ctrl+Shift+P",
  timeout: 1000,
  target: document,
  preventDefault: true,
  maxTriggers: Infinity,
  debug: false,
  callback: () => {},
});
```

**参数说明:**

- `keys` (string | Array): 按键配置
  - 字符串: `'Ctrl+C'`, `'↑↑↓↓←→BA'`, `'hello'`
  - 数组: `['Ctrl', 'C']`, `['↑', '↑', '↓', '↓']`
- `options/config` (Object): 配置选项
  - `keys` (string | Array): 按键序列
  - `timeout` (Number): 按键间超时时间，默认 1000ms（序列模式有效）
  - `target` (Element): 监听目标，默认 `document`
  - `preventDefault` (Boolean): 是否阻止默认行为，默认 `true`
  - `maxTriggers` (Number): 最大触发次数，默认 `Infinity`
  - `debug` (Boolean): 是否开启调试，默认 `false`
  - `callback` (Function): 触发回调函数

### 核心方法

#### `keys(keyString | keyArray)`

设置按键序列

```javascript
combo.keys("Ctrl+S");
combo.keys(["Ctrl", "S"]);
```

#### `timeout(milliseconds)`

设置按键间超时时间（序列模式）

```javascript
combo.timeout(500); // 设置为500ms
```

#### `onTrigger(callback, preventDefault)`

设置触发回调函数

```javascript
combo.onTrigger((info) => {
  console.log("触发了！", info);
  // info 包含: { event, matched, triggerCount, timestamp }
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
//   currentKeys: ['+KeyA', '+KeyB'],
//   triggerCount: 1,
//   maxTriggers: 3,
//   keys: 'Ctrl+S',
//   target: document,
//   mode: 'combo'
// }
```

## 🏗️ 设计思路与架构

### 核心设计理念

**ComboKeys 2.1** 采用现代化的单例式虚拟键盘表设计：

#### 1. **虚拟键盘表**

全局维护一个虚拟键盘状态表，实时跟踪所有按键的按下/释放状态：

```typescript
// 全局虚拟键盘状态
const keyboardState: Record<string, 0 | 1> = {};

// 更新按键状态
function updateKeyboardState(code: string, pressed: 0 | 1): void {
  keyboardState[code] = pressed;
}

// 检查按键是否按下
function isKeyPressed(code: string): boolean {
  return keyboardState[code] === 1;
}

// 检查修饰键组（左右通用）
function isModifierGroupPressed(modifierGroup: string[]): boolean {
  return modifierGroup.some((code) => keyboardState[code] === 1);
}
```

#### 2. **双模式触发机制**

- **组合键模式 (combo)**：包含修饰键，同时按下时立即触发
- **序列模式 (sequence)**：普通按键，按顺序输入后触发

#### 3. **事件驱动**

- 同时监听 `keydown` 和 `keyup` 事件
- 组合键模式：只处理 `keydown`，检测所有目标键是否同时按下
- 序列模式：处理 `keydown`，检测按键顺序是否匹配

#### 4. **建造者模式**

- 流式接口设计，每个配置方法返回 `this`
- 支持链式调用

### 自动模式检测

```javascript
// 包含修饰键 → 组合键模式
'Ctrl+C'      → mode: 'combo'
'Ctrl+Alt+K'  → mode: 'combo'

// 普通按键 → 序列模式
'hello'       → mode: 'sequence'
'↑↑↓↓←→BA'    → mode: 'sequence'
```

### 两种工作模式

#### 🔗 组合键模式（Combo Mode）

当检测到修饰键（Ctrl、Alt、Shift、Meta）时自动启用组合键模式。所有目标键同时按下时立即触发：

```javascript
// Ctrl+C - 触发时机：Ctrl 和 C 同时按下
new ComboKeys("Ctrl+C").onTrigger(() => console.log("复制")).start();

// Ctrl+Alt+Delete - 三键组合
new ComboKeys("Ctrl+Alt+Delete").onTrigger(() => console.log("任务管理器")).start();

// Ctrl+Alt+Shift+A - 四键组合
new ComboKeys("Ctrl+Alt+Shift+A").onTrigger(() => console.log("四键组合触发！")).start();
```

**工作原理：**

1. 监听所有 `keydown` 事件
2. 更新虚拟键盘表 `keyboardState[code] = 1`
3. 检查所有目标按键是否在虚拟键盘表中都是按下状态
4. 如果全部按下，触发回调并重置状态

#### 🔢 序列模式（Sequence Mode）

普通按键（不含修饰键）自动启用序列模式。按键按顺序输入后触发：

```javascript
// 科乐美秘籍
new ComboKeys("↑↑↓↓←→←→BA")
  .timeout(1500)
  .onTrigger(() => console.log("秘籍激活！"))
  .start();

// 简单序列
new ComboKeys("hello")
  .timeout(1000)
  .onTrigger(() => console.log("输入了 hello"))
  .start();
```

**工作原理：**

1. 监听所有 `keydown` 事件
2. 按顺序检查每个按键是否匹配
3. 记录已匹配的按键数量
4. 全部匹配后触发回调
5. 如果超时未完成，重置状态

### 按键格式支持

ComboKeys 2.1 支持多种灵活的按键写法：

#### 字符串格式（推荐）

```javascript
// 组合键 - 用 + 连接
new ComboKeys("Ctrl+C");
new ComboKeys("Ctrl+Alt+Shift+K");

// 序列键 - 直接连续
new ComboKeys("↑↑↓↓←→←→BA");
new ComboKeys("hello");
new ComboKeys("idkfa");
```

#### 数组格式

```javascript
// 组合键
new ComboKeys(["Ctrl", "C"]);
new ComboKeys(["Ctrl", "Alt", "Delete"]);

// 序列键
new ComboKeys(["↑", "↑", "↓", "↓", "←", "→", "←", "→", "B", "A"]);
new ComboKeys(["h", "e", "l", "l", "o"]);
```

### 错误处理机制

```javascript
// 参数类型验证
if (!keys) {
  throw new Error("按键序列不能为空");
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

## 🎯 使用场景

### 快捷键监听

```javascript
// 编辑器快捷键
const shortcuts = new ComboKeys("Ctrl+Shift+P").onTrigger(() => openCommandPalette()).start();

// 保存
new ComboKeys("Ctrl+S").onTrigger(() => saveDocument()).start();

// 撤销/重做
new ComboKeys("Ctrl+Z").onTrigger(() => undo()).start();
new ComboKeys("Ctrl+Shift+Z").onTrigger(() => redo()).start();
```

### 游戏开发

```javascript
// 移动控制
new ComboKeys("↑").onTrigger(() => moveUp(), false).start();
new ComboKeys("↓").onTrigger(() => moveDown(), false).start();
new ComboKeys("←").onTrigger(() => moveLeft(), false).start();
new ComboKeys("→").onTrigger(() => moveRight(), false).start();

// 攻击
new ComboKeys("Space").onTrigger(() => attack(), false).start();
```

### 隐藏功能激活

```javascript
// 开发者模式激活
const devMode = new ComboKeys("DEV")
  .timeout(2000)
  .onTrigger(() => toggleDeveloperMode(), false)
  .maxTriggers(1)
  .start();

// 科乐美秘籍
new ComboKeys("↑↑↓↓←→←→BA")
  .timeout(1500)
  .onTrigger(() => activateCheatMode(), false)
  .start();
```

## 🎨 最佳实践

### 1. 错误处理

```javascript
try {
  const combo = new ComboKeys("Ctrl+C").onTrigger(() => console.log("复制")).start();
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
import ComboKeys from "./dist/index.js";

// CommonJS
const ComboKeys = require("./dist/index.js");

// 直接引入
<script src="dist/index.js"></script>;
```

## 🚀 版本更新

### v2.1.0 (当前版本)

- ✨ **全新 API**：支持字符串格式 `'Ctrl+C'`，更直观易用
- 🔗 **双模式支持**：组合键模式（同时按下）和序列键模式（顺序输入）
- 🗂️ **虚拟键盘表**：全局状态跟踪所有按键，提升多键组合可靠性
- 🔄 **自动模式检测**：根据按键内容自动判断触发模式
- 📦 **精简代码**：移除 `pressedModifiers`，逻辑更清晰

### v2.0.0

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
