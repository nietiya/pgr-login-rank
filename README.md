# 战双登录界面 · 排行榜

把《战双帕弥什》历代**登录界面 CG** 拖成你自己的排行榜。

- 59 张图，来自碧蓝…（不是）——来自 **战双帕弥什 WIKI** 的「画册 / 登录界面」页
- 按住右侧 **⋮⋮** 上下拖动排序；顺序会自动记在浏览器本地
- 「导出排名」可以复制成文字，发给别人
- 纯静态：一个 `index.html` + `data.json` + `images/`，没有任何后端

## 发到 GitHub Pages（5 分钟）

1. 新建一个仓库，名字随意，比如 `pgr-login-rank`，**Public**
2. 把本文件夹里的全部内容传到仓库根目录（网页上 `Add file → Upload files` 直接拖进去也行）
3. 仓库 **Settings → Pages**
4. `Build and deployment` 里：Source 选 **Deploy from a branch**，Branch 选 **main**，目录选 **/ (root)**，Save
5. 等一两分钟，地址就是：
   `https://<你的用户名>.github.io/pgr-login-rank/`

把这个链接发给别人，他们打开就能自己排。

## 说明

- 图片版权归库洛游戏所有，这里只作同人非商业用途；如需转载请看官方二次创作规约。
- 想让别人**提交**排名，需要后端（GitHub Pages 只有静态文件）——现在是“各排各的，复制文字发回来”。

## 收集大家的排名（可选，Cloudflare 免费）

1. 打开 <https://dash.cloudflare.com/> → **Workers & Pages** → **Create** → **Worker**，名字随意
2. 左侧 **KV** → **Create namespace**，名字随意（比如 `pgr-votes`）
3. 回到 Worker → **Settings → Variables → KV Namespace Bindings** → 添加绑定：
   - Variable name 填 **`VOTES`**（必须一字不差）
   - Namespace 选刚才建的那个
4. 把仓库里 `worker/worker.js` 的内容整段粘进 Worker 编辑器，**Deploy**
5. 复制 Worker 的地址（形如 `https://pgr-vote.xxx.workers.dev`）
6. 打开 `index.html`，找到这一行，把地址填进去：

```js
var VOTE_ENDPOINT = "";   // ← 填这里
```

7. 重新上传 `index.html` 到 GitHub

之后站点上会多出两个按钮：**提交我的排名**（把顺序发给 Worker）、**看看全网**（看平均名次）。

> 防刷：同一 IP 每天最多 5 票；只存“名次之和 + 次数”，不存个人身份。
