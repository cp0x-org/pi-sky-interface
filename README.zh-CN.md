# cp0x 的无需许可 SKY 界面

[English](./README.md) | **简体中文**

一个开源、无需许可的 SKY 协议界面，可供用户直接、不受限制地与智能合约交互。

## 语言

界面支持英语和简体中文。可通过页面顶部导航栏中的语言切换按钮更改语言，所选语言会保存在浏览器中，刷新页面后依然生效。

## 应用链接

- 官网：[pi.cp0x.com](https://pi.cp0x.com/)
- 界面：[sky.cp0x.com](https://sky.cp0x.com)
- Twitter：[@cp0xdotcom](https://x.com/cp0xdotcom)
- Telegram：[@cp0xdotcom](https://t.me/cp0xdotcom)

## 协议文档

- 文档：[developers.sky.money](https://developers.sky.money/)

## 参与贡献

有关本地部署、开发和代码贡献的步骤，请参阅 [CONTRIBUTING](./CONTRIBUTING.md)（英文）。

### 添加或修改翻译

翻译文案存放在 `src/utils/locales/` 目录下：

- `en.json` — 英语
- `zh.json` — 简体中文

两个文件的键必须保持一致。界面文案通过 `react-intl` 渲染（在 JSX 中使用 `<FormattedMessage />`，在代码中使用 `useIntl()`），因此新增文案时请添加对应的键，不要在组件中直接硬编码文字。

请注意：仅翻译静态界面文案。来自 API 或智能合约的数据（余额、地址、代币符号、交易哈希等）保持原样，不作翻译。
