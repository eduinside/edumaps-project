// 외부 링크·이미지 점검 (Node 내장 기능만 사용 — GitHub Actions에서 npm ci 없이 실행)
// 사용: npm run data:check-links -- [--out report.md] [--strict]
//   external_url은 GET(리다이렉트 따라감), image_url은 HEAD. 기본 종료 코드 0, --strict면 문제 시 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const outIdx = args.indexOf('--out');
const outFile = outIdx >= 0 ? args[outIdx + 1] : null;

const TIMEOUT = 15000;
const CONCURRENCY = 8;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'resources.json'), 'utf8'));

async function check(url, method) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: method === 'GET' ? 'text/html,*/*' : '*/*', 'Accept-Language': 'ko-KR,ko;q=0.9' },
    });
    if (method === 'GET') res.body?.cancel().catch(() => {});
    return { status: res.status, finalUrl: res.url };
  } catch (e) {
    const cause = e.name === 'AbortError' ? '시간 초과' : e.cause?.code || e.cause?.message || e.message;
    return { status: 0, error: cause };
  } finally {
    clearTimeout(timer);
  }
}

// 상태 분류: 정상 / 확인 필요(봇 차단 가능) / 오류
function classify(r) {
  if (r.status >= 200 && r.status < 400) return 'ok';
  if (r.status === 403 || r.status === 429 || r.status >= 500) return 'review';
  return 'error';
}

const jobs = [];
for (const it of data.items) {
  if (it.external_url) jobs.push({ it, kind: '링크', url: it.external_url, method: 'GET' });
  if (it.image_url) jobs.push({ it, kind: '이미지', url: it.image_url, method: 'HEAD' });
}

const results = [];
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const job = jobs[next++];
    const r = await check(job.url, job.method);
    results.push({ ...job, ...r, level: classify(r) });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const order = new Map(jobs.map((j, i) => [j, i]));
results.sort((a, b) => order.get(a) - order.get(b));

const bad = results.filter((r) => r.level !== 'ok');
const http = data.items.filter((i) => /^http:\/\//.test(i.external_url));
const host = (u) => {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
};
const redirected = results.filter(
  (r) => r.level === 'ok' && r.kind === '링크' && r.finalUrl && host(r.finalUrl) !== host(r.url),
);

const lines = [];
lines.push(`# 외부 링크 점검 결과`);
lines.push('');
lines.push(`- 점검 시각: ${new Date().toISOString()} · 데이터 발행 ${data.generatedAt}`);
lines.push(`- 대상: 링크 ${jobs.filter((j) => j.kind === '링크').length}건, 이미지 ${jobs.filter((j) => j.kind === '이미지').length}건`);
lines.push(
  `- 결과: 정상 ${results.length - bad.length}, 확인 필요 ${bad.filter((r) => r.level === 'review').length}, 오류 ${bad.filter((r) => r.level === 'error').length}`,
);
lines.push('');
if (bad.length) {
  lines.push('## 문제 항목');
  lines.push('');
  lines.push('| 구분 | id | 이름 | 상태 | 주소 |');
  lines.push('|---|---|---|---|---|');
  for (const r of bad) {
    const label = r.level === 'review' ? '확인 필요' : '오류';
    const st = r.status ? `HTTP ${r.status}` : r.error;
    lines.push(`| ${label}(${r.kind}) | ${r.it.id} | ${r.it.title} | ${st} | ${r.url} |`);
  }
  lines.push('');
  lines.push('> 403·429·5xx는 자동 요청 차단일 수 있으니 브라우저로 직접 열어 확인하세요.');
  lines.push('');
}
if (http.length) {
  lines.push('## http:// 링크 (https 지원 여부 확인)');
  lines.push('');
  for (const i of http) lines.push(`- ${i.id} ${i.title}: ${i.external_url}`);
  lines.push('');
}
if (redirected.length) {
  lines.push('## 다른 도메인으로 이동하는 링크 (주소 변경 의심)');
  lines.push('');
  for (const r of redirected) lines.push(`- ${r.it.id} ${r.it.title}: ${r.url} → ${r.finalUrl}`);
  lines.push('');
}
if (!bad.length) lines.push('문제 없음.');

const report = lines.join('\n');
console.log(report);
if (outFile) fs.writeFileSync(path.resolve(process.cwd(), outFile), report + '\n', 'utf8');
// Actions: 문제 건수를 다음 단계로 전달
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `problems=${bad.length + http.length}
`);
process.exit(strict && bad.length ? 1 : 0);
