/**
 * 战双剧情排行 · 投票收集 Worker（Cloudflare Workers + KV）
 *
 * 接口：
 *   POST /vote   body: {"order": ["01_碎梦", "02_黑星坠落", ...]}
 *                → 记下每个 id 的名次（1 起），返回 {ok, votes}
 *   GET  /stats  → {ok, votes, items: {id: {sum, count, avg}}}
 *
 * 绑定：KV namespace 变量名必须是 VOTES
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8"
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CORS });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (url.pathname === "/vote" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch (e) { return json({ ok: false, error: "bad json" }, 400); }

      const order = body && body.order;
      if (!Array.isArray(order) || order.length < 2 || order.length > 1000) {
        return json({ ok: false, error: "bad order" }, 400);
      }
      // 粗校验：id 只能是短字符串
      for (const id of order) {
        if (typeof id !== "string" || id.length > 64) return json({ ok: false, error: "bad id" }, 400);
      }

      // 同一 IP 每天最多 5 票，防刷
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const day = new Date().toISOString().slice(0, 10);
      const ipKey = `ip:${ip}:${day}`;
      const used = Number((await env.VOTES.get(ipKey)) || 0);
      if (used >= 5) return json({ ok: false, error: "too many votes today" }, 429);
      await env.VOTES.put(ipKey, String(used + 1), { expirationTtl: 86400 * 2 });

      // 累加名次
      for (let i = 0; i < order.length; i++) {
        const key = `item:${order[i]}`;
        const raw = await env.VOTES.get(key);
        const cur = raw ? JSON.parse(raw) : { sum: 0, count: 0 };
        cur.sum += (i + 1);
        cur.count += 1;
        await env.VOTES.put(key, JSON.stringify(cur));
      }

      const total = Number((await env.VOTES.get("total")) || 0) + 1;
      await env.VOTES.put("total", String(total));

      return json({ ok: true, votes: total });
    }

    if (url.pathname === "/stats" && request.method === "GET") {
      const total = Number((await env.VOTES.get("total")) || 0);
      const list = await env.VOTES.list({ prefix: "item:", limit: 1000 });
      const items = {};
      for (const k of list.keys) {
        const raw = await env.VOTES.get(k.name);
        if (!raw) continue;
        const v = JSON.parse(raw);
        const id = k.name.slice(5);
        items[id] = { sum: v.sum, count: v.count, avg: v.count ? +(v.sum / v.count).toFixed(2) : null };
      }
      return json({ ok: true, votes: total, items });
    }

    return json({ ok: false, error: "not found" }, 404);
  }
};
