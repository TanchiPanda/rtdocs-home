# rtdocs-home

r6t5-docs（rtdocs）项目官网：介绍、功能对比、路线图、搭建指南、授权说明，以及实时 Star 数与用户头像墙。

- 纯静态，GitHub Pages 部署
- `data/repos.json` 由 `.github/workflows/stats.yml` 每 6 小时生成，页面只读静态数据
- 自定义域名：`rtdocs.r6t5.dpdns.org`（`CNAME` 已写入，DNS 记录需自行配置）

本地预览：

```bash
python3 -m http.server 8080
```

手动刷新 Star 数据：

```bash
GITHUB_TOKEN=xxx node scripts/fetch-stats.mjs
```
