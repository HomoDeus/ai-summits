# AI Summits · 人类难题地图

[English](../README.md) · 简体中文 · [Español](README.es.md)

一个开源交互地图：将人类已知难题呈现为山峰，展示 AI 带来的历史突破及尚未解决的部分。

首版包含 23 个学科、30 个代表性问题，支持英文、简体中文和西班牙语。每个问题直接展示“现在到了哪一步”和“接下来还差什么”，配有带年份的山路与证据时间线。支持旋转地形、搜索、筛选和历史回放。

这不是完整目录或实时排行榜。山高不是难度，颜色不是完成率。“具体目标已达成”不等于整个领域被解决。灰色仅表示对应年份之前尚未收录 AI 里程碑。

## 本地运行

需要 Node 24 和 npm：

```sh
git clone https://github.com/HomoDeus/ai-summits.git
cd ai-summits
npm ci
npm run dev
```

打开终端显示的本地地址。无需 API 密钥、数据库或账号。

`npm run check` 执行检查与测试；`npm run build` 生成 `out/` 静态网站。部署、贡献和证据标准以[英文 README](../README.md)、[贡献规范](../CONTRIBUTING.md)及[编辑政策](EDITORIAL_POLICY.md)为准。

代码、原创数据摘要和翻译使用 [MIT 许可证](../LICENSE)。来源链接中的内容保留各自权利。欢迎补充问题、证据和翻译。
