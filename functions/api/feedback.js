// POST /api/feedback — 이용방법 > 의견 보내기 폼. Resend로 운영자에게 메일을 보낸다. Cloudflare Pages Function.
// (dge-atlas의 functions/api/feedback.js를 따름) 내용은 저장·로그하지 않고 메일로만 전달한다. 유형·내용만 받는다.
// 환경변수: RESEND_API_KEY(암호화), FEEDBACK_TO(받는 주소, 쉼표로 여러 개), FEEDBACK_FROM(Resend에 인증된 보내는 주소, 예: "대구 에듀맵스 <edumaps-noreply@dgedu.link>")
// ※ 사이트 본체는 100% 정적이며, 이 함수는 의견 전달 전용 예외다.

const MAX_MSG = 3000;
const KINDS = ["정보 수정", "장소·자료 추천", "기능 제안", "기타 의견"];
const ALLOWED_HOSTS = /^(map\.dgedu\.link|localhost|127\.0\.0\.1)$/;
// IP당 분·일 횟수 제한(무료 Cache API, 데이터센터별 근사치). IP는 해시 키로만 쓴다.
const LIMITS = [{ win: 60, max: 3 }, { win: 86400, max: 20 }];

async function overLimit(request) {
  const cache = globalThis.caches?.default;
  if (!cache) return false;
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip)))].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
  const now = Math.floor(Date.now() / 1000);
  let over = false;
  for (const { win, max } of LIMITS) {
    const key = new Request(`https://ratelimit.map.dgedu.link/feedback/${win}/${Math.floor(now / win)}/${hash}`);
    const n = Number(await (await cache.match(key))?.text() ?? 0);
    if (n >= max) over = true;
    else await cache.put(key, new Response(String(n + 1), { headers: { "Cache-Control": `max-age=${win}` } }));
  }
  return over;
}

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function onRequestPost({ request, env }) {
  if (!ALLOWED_HOSTS.test(new URL(request.url).hostname)) return json({ error: "허용되지 않은 주소입니다." }, 403);
  if (!env.RESEND_API_KEY || !env.FEEDBACK_TO || !env.FEEDBACK_FROM) return json({ error: "지금은 의견을 받을 수 없어요. 나중에 다시 보내 주세요." }, 503);

  const b = await request.json().catch(() => null);
  if (!b) return json({ error: "잘못된 요청입니다." }, 400);
  if (b.website) return json({ ok: true }); // 봇용 숨은 칸(허니팟)을 채웠으면 조용히 버린다
  const message = String(b.message ?? "").trim();
  const kind = KINDS.includes(b.kind) ? b.kind : "기타 의견";
  if (message.length < 5) return json({ error: "내용을 5자 이상 적어 주세요." }, 400);
  if (message.length > MAX_MSG) return json({ error: `내용은 ${MAX_MSG}자까지 적을 수 있어요.` }, 400);
  if (await overLimit(request)) return json({ error: "잠시 뒤 다시 보내 주세요." }, 429);

  const from = request.headers.get("Referer") ?? "—";
  const sent = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long", timeStyle: "short" });

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.FEEDBACK_FROM,
      to: env.FEEDBACK_TO.split(",").map((s) => s.trim()),
      subject: `[에듀맵스 의견] ${kind}`,
      html: mailHtml({ kind, message, sent, from }),
      text: `유형: ${kind}\n보낸 화면: ${from}\n받은 시각: ${sent}\n\n${message}`,
    }),
  }).catch(() => null);
  if (!res?.ok) return json({ error: "보내지 못했어요. 잠시 뒤 다시 시도해 주세요." }, 502);
  return json({ ok: true });
}

// 메일 본문. 메일 앱 호환을 위해 표 레이아웃 + 인라인 스타일만 쓴다(사이트 브랜드 초록).
const KIND_COLOR = { "정보 수정": "#b45309", "장소·자료 추천": "#059669", "기능 제안": "#2563eb", "기타 의견": "#475569" };
function mailHtml({ kind, message, sent, from }) {
  const font = "font-family:Pretendard,'Apple SD Gothic Neo','Malgun Gothic',sans-serif";
  const c = KIND_COLOR[kind] ?? "#475569";
  return `<!doctype html><html lang="ko"><body style="margin:0;padding:24px 12px;background:#f8fafc;${font};color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;border-collapse:separate">
  <tr><td style="padding:16px 24px;border-bottom:3px solid #059669">
    <div style="font-size:12px;color:#64748b">대구 에듀맵스 · map.dgedu.link</div>
    <div style="margin-top:2px;font-size:18px;font-weight:800">새 의견이 도착했습니다</div>
  </td></tr>
  <tr><td style="padding:20px 24px 4px">
    <span style="display:inline-block;padding:3px 10px;border:1px solid ${c};border-radius:999px;color:${c};font-size:13px;font-weight:700">${esc(kind)}</span>
  </td></tr>
  <tr><td style="padding:12px 24px 20px">
    <div style="padding:14px 16px;background:#f8fafc;border-left:3px solid ${c};border-radius:4px;font-size:15px;line-height:1.7;white-space:pre-wrap;word-break:break-word">${esc(message)}</div>
  </td></tr>
  <tr><td style="padding:12px 24px 16px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b">
    받은 시각 ${esc(sent)}<br>보낸 화면 ${esc(from)}<br>이용방법 &gt; 의견 보내기 폼에서 보낸 메일입니다. 답장은 보낸 분께 가지 않습니다.
  </td></tr>
</table></body></html>`;
}
