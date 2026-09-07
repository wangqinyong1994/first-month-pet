# 检查报告

## P2 — Concern 操作缺少明确成功反馈

- 路径：`/concerns/not_eating_or_drinking`
- 前置条件：已登录、已有资料。
- 复现：打开 Concern 详情，点击 `Observe closely`。
- 预期：保存后页面应显示本次操作已保存或当前选择状态，帮助用户确认动作已经完成。
- 实际：页面保持在同一路径并重新渲染，按钮继续可用；可见内容没有成功提示或已选择状态。后端是否已写入无法仅凭 UI 证据确认。
- 影响：用户可能重复提交或不确定选择是否生效。
- 建议归属：后续修复归入 Concern action feedback 任务；本任务不修改代码。

## BLOCKED — 未登录和支付状态矩阵未完成

- 当前测试会话是已登录且已解锁账户。
- 按安全边界未清理登录状态、未伪造会话、未创建真实订单或退款。
- 需要独立测试账号/可控测试数据后，补测 `/`、`/login`、`/onboarding`、免费用户 `/paywall`、checkout pending/failed/paid 回跳。

## BLOCKED — 移动端视口与 check-in 写入

- 本轮桌面检查完成；390px 视口尚未切换。
- check-in 按钮在一次浏览器 CDP 鼠标事件中超时，未把已有页面显示的 `Saved: better` 当作本轮写入证据。
