// 에듀맵스 데이터 스크립트 공용 모듈 (Node 내장 모듈만 사용)
// D1(edu-link-db, edumaps_* 테이블) ↔ src/data/resources.json 변환·검증
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DB_NAME = 'edu-link-db';
export const MEDIA_BASE = 'https://dgedu.link/media/edumaps/';
export const RESOURCES_JSON = path.join(ROOT, 'src', 'data', 'resources.json');
export const VERIFY_MAX_DAYS = 180;
export const SHORT_DESC_WARN = 15; // 이 길이 미만이면 경고(10자 미만은 DB가 거부)

// ── CLI 인자 ─────────────────────────────────────────────
export function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Set();
  const opts = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      // 값을 받는 옵션
      if (['name', 'out'].includes(key) && next && !next.startsWith('--')) {
        opts[key] = next;
        i++;
      } else flags.add(key);
    } else positional.push(a);
  }
  return { flags, opts, positional };
}

export function targetFlag(flags) {
  return flags.has('local') ? '--local' : '--remote';
}

// ── wrangler 실행 ────────────────────────────────────────
// Windows에서 npx는 .cmd라 shell 경유. 인자는 직접 따옴표 처리.
function quoteArg(a) {
  if (/^[\w\-./:=@]+$/.test(a)) return a;
  return `"${String(a).replace(/"/g, '\\"')}"`;
}

export function runWrangler(args, { inherit = false } = {}) {
  // 설정은 db/wrangler.jsonc(데이터 전용). 루트에 두면 CF Pages가 프로젝트 설정으로 읽는다.
  const cmd = ['npx', '--no-install', 'wrangler', ...args, '--config', 'db/wrangler.jsonc'].map(quoteArg).join(' ');
  const res = spawnSync(cmd, {
    cwd: ROOT,
    shell: true,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: inherit ? 'inherit' : 'pipe',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false', FORCE_COLOR: '0' },
  });
  return { status: res.status ?? 1, stdout: res.stdout ?? '', stderr: res.stderr ?? '' };
}

// wrangler --json 출력에서 JSON 부분만 추출(앞쪽 npm notice 등 제거)
function extractJson(stdout) {
  const lines = stdout.split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith('[') || l.startsWith('{'));
  if (start < 0) return null;
  try {
    return JSON.parse(lines.slice(start).join('\n'));
  } catch {
    return null;
  }
}

function d1Fail(res, what) {
  const parsed = extractJson(res.stdout);
  const msg = parsed?.error?.text || parsed?.error?.message || res.stderr.trim() || res.stdout.trim();
  throw new Error(`D1 ${what} 실패:\n${msg}`);
}

// 짧은 조회(SELECT). 원격 --file은 행을 돌려주지 않으므로 --command 사용.
// 따옴표(")·% 문자를 쓰지 말 것(Windows cmd).
export function d1Query(sql, target) {
  const res = runWrangler(['d1', 'execute', DB_NAME, target, '--json', '--command', sql]);
  const parsed = extractJson(res.stdout);
  if (res.status !== 0 || !Array.isArray(parsed)) d1Fail(res, '조회');
  return parsed.flatMap((r) => r.results ?? []);
}

// SQL 파일 실행(쓰기). 원격은 확인 프롬프트를 -y로 넘김.
export function d1ExecFile(file, target) {
  const args = ['d1', 'execute', DB_NAME, target, '--file', file];
  if (target === '--remote') args.push('-y');
  const res = runWrangler([...args, '--json']);
  const parsed = extractJson(res.stdout);
  if (res.status !== 0 || parsed?.error) d1Fail(res, `실행(${path.basename(file)})`);
  return parsed;
}

export function tempFile(name, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edumaps-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content, 'utf8');
  return file;
}

// ── SQL 리터럴 ───────────────────────────────────────────
export function sqlStr(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}
export const sqlJson = (v) => sqlStr(JSON.stringify(v));

// ── D1 → resources.json ─────────────────────────────────
export function readAll(target) {
  const items = d1Query('SELECT * FROM edumaps_items ORDER BY sort, id', target);
  const topics = d1Query('SELECT * FROM edumaps_topics ORDER BY sort, id', target);
  const changelog = d1Query('SELECT * FROM edumaps_changelog ORDER BY date DESC, sort, id', target);
  return { items, topics, changelog };
}

const parseJsonCol = (v, fallback = []) => {
  try {
    return JSON.parse(v ?? 'null') ?? fallback;
  } catch {
    return fallback;
  }
};

export const imageUrlOf = (row) => row.image_url || `${MEDIA_BASE}${row.id}.webp`;

// 키 순서는 기존 resources.json과 동일하게 유지(diff 최소화)
export function topicToJson(t) {
  return {
    usage_index: t.sort,
    grade: t.grade,
    subject: t.subject,
    month: `${t.month}월`,
    topic_title: t.topic_title,
    description: t.description,
    inquiry_questions: parseJsonCol(t.inquiry_questions),
    post_activities: parseJsonCol(t.post_activities),
  };
}

export function itemToJson(row, topics) {
  const online = row.type === 'ONLINE';
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    category: row.category,
    tags: parseJsonCol(row.tags),
    recommended_grade: parseJsonCol(row.recommended_grades).map((g) => String(g)),
    description: row.description,
    location: online || row.lat == null ? { lat: 0, lng: 0 } : { lat: row.lat, lng: row.lng },
    image_url: imageUrlOf(row),
    external_url: row.external_url,
    grade_topics: topics.map(topicToJson),
  };
}

export function buildPayload({ items, topics, changelog }, generatedAt) {
  const active = items.filter((r) => Number(r.is_active) !== 0);
  const byItem = new Map(active.map((r) => [r.id, []]));
  for (const t of topics) byItem.get(t.item_id)?.push(t);
  return {
    generatedAt,
    items: active.map((r) => itemToJson(r, byItem.get(r.id))),
    changelog: changelog.map((c) => ({ date: c.date, text: c.text })),
  };
}

// ── 검증(§4-2) ───────────────────────────────────────────
// DB CHECK로 못 거르는 규칙. errors가 있으면 발행 중단.
export function validate({ items, topics }, now = new Date()) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const itemMap = new Map();

  for (const r of items) {
    if (ids.has(r.id)) errors.push(`${r.id}: id 중복`);
    ids.add(r.id);
    itemMap.set(r.id, r);
    const label = `${r.id} ${r.title ?? ''}`.trim();
    for (const k of ['type', 'title', 'category', 'description', 'external_url']) {
      if (r[k] == null || String(r[k]).trim() === '') errors.push(`${label}: 필수값 없음(${k})`);
    }
    if (r.type === 'OFFLINE' && (r.lat == null || r.lng == null)) errors.push(`${label}: 현장 장소인데 좌표 없음`);
    const grades = parseJsonCol(r.recommended_grades, null);
    if (!Array.isArray(grades) || grades.length === 0) errors.push(`${label}: 권장 학년 없음`);
    else if (grades.some((g) => !Number.isInteger(Number(g)) || g < 1 || g > 6))
      errors.push(`${label}: 권장 학년 값 오류 ${JSON.stringify(grades)}`);
    if (!Array.isArray(parseJsonCol(r.tags, null))) errors.push(`${label}: tags가 배열이 아님`);
    if (/^http:\/\//.test(r.external_url ?? '')) warnings.push(`${label}: http:// 링크 (${r.external_url})`);
    if ((r.description ?? '').length < SHORT_DESC_WARN) warnings.push(`${label}: 설명이 짧음 "${r.description}"`);
  }

  for (const t of topics) {
    const item = itemMap.get(t.item_id);
    const label = `주제#${t.id}(${t.item_id} ${t.grade}학년 ${t.topic_title})`;
    if (!item) {
      errors.push(`${label}: 없는 장소를 가리킴(고아 주제)`);
      continue;
    }
    if (Number(item.is_active) === 0) continue;
    const grades = parseJsonCol(item.recommended_grades).map(Number);
    if (!grades.includes(Number(t.grade)))
      errors.push(`${label}: 주제 학년이 권장 학년 ${JSON.stringify(grades)}에 없음`);
    for (const k of ['subject', 'topic_title']) {
      if (!t[k] || String(t[k]).trim() === '') errors.push(`${label}: 필수값 없음(${k})`);
    }
  }

  // 최종 확인일: 개수만 요약
  const limit = now.getTime() - VERIFY_MAX_DAYS * 86400000;
  const active = items.filter((r) => Number(r.is_active) !== 0);
  const unverified = active.filter((r) => !r.verified_at).length;
  const stale = active.filter((r) => r.verified_at && Date.parse(r.verified_at) < limit).length;
  if (unverified) warnings.push(`최종 확인일(verified_at) 미기록 ${unverified}건`);
  if (stale) warnings.push(`최종 확인일이 ${VERIFY_MAX_DAYS}일 지난 항목 ${stale}건`);

  return { errors, warnings };
}

// ── 시각(KST) ────────────────────────────────────────────
export function kstNow(date = new Date()) {
  const k = new Date(date.getTime() + 9 * 3600000);
  const p = (n) => String(n).padStart(2, '0');
  return `${k.getUTCFullYear()}.${p(k.getUTCMonth() + 1)}.${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}

// ── 파일 쓰기(기존 줄바꿈 형식 유지) ────────────────────
export function writeJsonLike(file, data, { refFile = file } = {}) {
  let text = JSON.stringify(data, null, 2);
  let crlf = false;
  let trailing = false;
  if (fs.existsSync(refFile)) {
    const prev = fs.readFileSync(refFile, 'utf8');
    crlf = prev.includes('\r\n');
    trailing = /\n$/.test(prev);
  }
  if (trailing) text += '\n';
  if (crlf) text = text.replace(/\n/g, '\r\n');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text, 'utf8');
}

export function git(args, opts = {}) {
  const res = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: 'inherit', ...opts });
  if (res.status !== 0) throw new Error(`git ${args.join(' ')} 실패`);
  return res;
}
