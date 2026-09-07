# 检查清单

检查时间：2026-09-07；运行环境：本地 Next.js 开发服务器 `http://localhost:3002`；浏览器：ego-browser；视口：桌面约 1880×937，移动 390px 未能在本轮完成。

| 范围 | 状态 | 证据/说明 |
|---|---|---|
| `/home` 已登录 | PASS | 页面渲染、主导航、退出、Concern 链接、Plan 链接、check-in 三个按钮均可见；显示当前保存值。 |
| `/plan` 已登录/已解锁 | PASS | 时间状态、任务状态、Undo 表单、帮助阈值和导航均渲染。 |
| `/profile` 已登录 | PASS | 资料表单、下拉框、复选框、Save profile、账户状态和 milestones 均渲染。 |
| `/concerns/not_eating_or_drinking` 已登录 | PASS | 三个 Next step 按钮、分级指导、急症阈值均渲染；点击后页面重新渲染。 |
| `/paywall` 已解锁用户 | PASS | 按当前账户状态正确回到 `/home`，未触发真实支付。 |
| 公共 `/about`、`/guidance`、`/refund`、`/contact` | PASS | 页面内容、公共信息导航和支持入口可渲染。 |
| `/`、`/login`、`/onboarding` 未登录分支 | BLOCKED | 当前 ego-browser 会话已登录；未清除会话，也未绕过鉴权建立第二个测试账号。 |
| 免费用户 Paywall/checkout 分支 | BLOCKED | 当前测试账户为 unlocked；未执行真实支付或退款。 |
| check-in 写入验证 | BLOCKED | 目标按钮存在，但一次 CDP 鼠标事件超时；未把结果误判为产品失败。 |
| 390px 移动布局 | BLOCKED | 本轮未完成移动视口切换。 |

## 静态与工程检查

- `npm test`：15/15 通过。
- `npm run lint`：通过。
- `npx tsc --noEmit`：通过。
- `git diff --check`：通过。
