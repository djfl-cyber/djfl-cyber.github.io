# 博客组件规范与 SDK 1.0

外部组件是预构建的访客 HTML/CSS/JS，运行于 `sandbox="allow-scripts"` 的独立 iframe。它不能访问本机文件、Git、管理端 IPC 或登录信息。Astro/React/Vue 源码和 npm 包需要先构建成这种格式。

## 从示例开始

本机 `scripts/studio/examples/music-player/` 是完整示例，“组件 → 音乐播放器示例”可直接检查并安装。导入文件夹或 ZIP 时，包根目录放 `component.json`，不能在 ZIP 外面多套一个目录。

```text
component.json
entry.html
runtime.js
style.css
schema.json
LICENSE
assets/
```

`entry.html` 引用自己的样式与脚本，资源使用包内相对地址。宿主会先加载 SDK，无需自行复制 SDK。访客必须点击播放按钮才启动有声媒体。

## 清单

```json
{
  "schemaVersion": 1,
  "id": "example.my-widget",
  "name": "我的组件",
  "version": "1.0.0",
  "hostApi": "^1.0.0",
  "kind": "widget",
  "runtime": "iframe",
  "entry": "entry.html",
  "configSchema": "schema.json",
  "placements": ["flow", "floating"],
  "defaultSize": {"width": 320, "height": 120},
  "capabilities": ["storage", "resize"],
  "networkOrigins": [],
  "integrity": {
    "entry.html": "填写该文件的 SHA256 小写十六进制值",
    "runtime.js": "填写该文件的 SHA256 小写十六进制值",
    "style.css": "填写该文件的 SHA256 小写十六进制值",
    "schema.json": "填写该文件的 SHA256 小写十六进制值",
    "LICENSE": "填写该文件的 SHA256 小写十六进制值"
  }
}
```

清单中的哈希示意文字必须替换为真实的 64 位值。`component.json` 自身不放入 integrity；其他所有文件，包括图片和声音，都必须列入。文件变化需要重新计算哈希；已安装版本不能原地覆盖，请增加版本号。

ID 使用至少两段小写名称，例如 `author.widget`；版本使用 `1.2.3`。默认宽高为 32～1200。可申请的能力只有 `audio`、`storage`、`resize`。外部来源只接受完整 HTTPS origin，例如 `https://media.example.com`，不能写通配符或带路径。首版应优先使用包内或博客素材。

包内最多 500 个文件，单文件最多 20 MB，总量最多 50 MB。禁止路径穿越、绝对路径、符号链接、联接点、本机可执行文件和 npm 安装脚本。导入先在私有区域核对全部字节，再整体安装到公开组件目录。

## 配置表单

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["title", "accent"],
  "properties": {
    "title": {"type": "string", "title": "标题", "default": "你好", "maxLength": 100},
    "accent": {"type": "string", "title": "强调色", "format": "color", "default": "#749279"},
    "image": {"type": "string", "title": "图片", "format": "asset", "default": ""},
    "speed": {"type": "number", "title": "速度", "minimum": 0, "maximum": 10, "default": 1},
    "animated": {"type": "boolean", "title": "动画", "default": true}
  }
}
```

支持 object、array、string、number、integer、boolean，以及 title、default、required、enum、minimum、maximum、maxLength、maxItems。对象最多 50 个字段，嵌套最多 6 层，数组最多 100 项；不支持 `$ref`、动态属性或任意字段。`color` 为六位十六进制；`asset` 为博客根路径或 HTTPS URL，不能是磁盘路径。素材选择器自动保存网站地址。

## SDK

```js
let config;
const removeInit = BlogComponent.on('init', data => {
  config = data.config;
  render(config);
  // data.instanceId / data.theme / data.viewport / data.capabilities
});
BlogComponent.on('config', value => { config = value; render(config); });
BlogComponent.on('theme', ({theme}) => setTheme(theme));
BlogComponent.on('viewport', ({width, height}) => resizeLayout(width, height));
BlogComponent.on('destroy', () => {
  stopAnimations();
  stopMedia();
  removeInit();
});
BlogComponent.status(''); // 清除状态；传入文字则显示简短错误
BlogComponent.resize(320, 120); // 需要 resize 能力
await BlogComponent.storage('set', 'preferences', {volume: 0.5});
const preferences = await BlogComponent.storage('get', 'preferences');
await BlogComponent.storage('remove', 'preferences');
```

存储需申请 storage，按组件和实例隔离，最多 32 个键，每值最多 4096 字符。键最多 64 字符；消息有大小与速率限制。配置保存后，静态博客以重新渲染/重新初始化的方式应用；SDK 也保留 config 更新消息。不要依赖 iframe 的直接 localStorage，沙箱中应使用 SDK 存储接口。

每个 frame 具有独立会话标识，宿主核对消息源和标识。页面离开、实例移除会触发 destroy；主题、视口改变会通知实例。减少动态效果请自行遵守 `prefers-reduced-motion`。组件发生错误应显示状态并停止自身活动，不影响正文。

## 布置与版本回退

安装后新建实例，默认停用。选择浮层时可设置位置、大小、页面范围与手机隐藏；选择页面区块时在设计器插入该实例。更新先安装新版本，旧包保留。配置验证不通过时不会写入；可切回旧版本、停用或重新填写新版本默认配置。

音乐播放器验证了导入、实例表单、真实画布和访客点击播放的闭环。桌宠、抽卡可按上述接口继续制作；静态浏览器存储不保证跨设备同步或可信概率记录。
