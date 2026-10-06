// 1회용 이관: 현재 src/data/resources.json(구글 시트 발행본) → D1 edumaps_* 테이블
// §4-1 정정(링크·학년·설명)을 변환 과정에서 반영하고 db/seed/0001_initial_from_sheet.sql 생성 후 적용.
// 사용: npm run data:init -- --local   (원격은 --remote, 최초 1회만)
// 주의: seed는 edumaps_* 테이블을 비우고 다시 채운다. 원격에 데이터가 있으면 --force 없이는 중단.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, RESOURCES_JSON, MEDIA_BASE, parseArgs, d1ExecFile, d1Query, sqlStr, sqlJson } from './lib.mjs';

const { flags } = parseArgs();
if (!flags.has('local') && !flags.has('remote')) {
  console.error('대상을 지정하세요: npm run data:init -- --local | --remote');
  process.exit(1);
}
const target = flags.has('local') ? '--local' : '--remote';

const SCHEMA = path.join(ROOT, 'db', 'schema.sql');
const SEED = path.join(ROOT, 'db', 'seed', '0001_initial_from_sheet.sql');

const data = JSON.parse(fs.readFileSync(RESOURCES_JSON, 'utf8'));
const items = structuredClone(data.items);
const log = [];
const find = (id) => items.find((i) => i.id === id);

// ── 정정 1: res_031 서비스 명칭 변경(aidtbook → edupath)
{
  const it = find('res_031');
  if (it) {
    log.push(`res_031 external_url: ${it.external_url} → https://www.edupath.kr/`);
    it.external_url = 'https://www.edupath.kr/';
    if (/aidtbook/i.test(it.title + it.description)) log.push('  (참고) res_031 제목·설명에 aidtbook 표기 있음 — 그대로 둠');
  }
}

// ── 정정 2: 주제 학년이 권장 학년에 없으면 보완
for (const it of items) {
  const have = new Set(it.recommended_grade.map(String));
  const missing = [...new Set(it.grade_topics.map((t) => String(t.grade)))].filter((g) => !have.has(g));
  if (missing.length) {
    const next = [...have, ...missing].sort((a, b) => Number(a) - Number(b));
    log.push(`${it.id} ${it.title} recommended_grade: [${it.recommended_grade}] → [${next}]`);
    it.recommended_grade = next;
  }
}

// ── 정정 3: res_196 서문시장 설명 보강
{
  const it = find('res_196');
  if (it && it.description.length < 10) {
    const desc = '대구를 대표하는 전통시장으로 다양한 먹거리와 시장 문화 체험';
    log.push(`res_196 description: "${it.description}" → "${desc}"`);
    it.description = desc;
  }
}

// ── SQL 생성
const out = [];
out.push('-- 에듀맵스 초기 데이터 (구글 시트 발행본 → D1 이관, scripts/data/init.mjs 생성)');
out.push(`-- 원본: src/data/resources.json generatedAt=${data.generatedAt}`);
out.push('-- 정정 내역:');
for (const l of log) out.push(`--   ${l}`);
out.push('');
out.push('DELETE FROM edumaps_topics;');
out.push('DELETE FROM edumaps_items;');
out.push('DELETE FROM edumaps_changelog;');
out.push('');

items.forEach((it, idx) => {
  const online = it.type === 'ONLINE';
  const defaultImg = `${MEDIA_BASE}${it.id}.webp`;
  const cols = {
    id: sqlStr(it.id),
    type: sqlStr(it.type),
    title: sqlStr(it.title),
    category: sqlStr(it.category),
    tags: sqlJson(it.tags),
    recommended_grades: sqlJson(it.recommended_grade.map(Number)),
    description: sqlStr(it.description),
    lat: online ? 'NULL' : sqlStr(it.location.lat),
    lng: online ? 'NULL' : sqlStr(it.location.lng),
    image_url: it.image_url === defaultImg ? 'NULL' : sqlStr(it.image_url),
    external_url: sqlStr(it.external_url),
    sort: String(idx),
  };
  out.push(`INSERT INTO edumaps_items (${Object.keys(cols).join(', ')}) VALUES (${Object.values(cols).join(', ')});`);
});
out.push('');

for (const it of items) {
  for (const t of it.grade_topics) {
    const month = parseInt(String(t.month), 10);
    const cols = {
      item_id: sqlStr(it.id),
      grade: String(Number(t.grade)),
      month: String(month),
      subject: sqlStr(t.subject),
      topic_title: sqlStr(t.topic_title),
      description: sqlStr(t.description),
      inquiry_questions: sqlJson(t.inquiry_questions ?? []),
      post_activities: sqlJson(t.post_activities ?? []),
      sort: String(t.usage_index),
    };
    out.push(`INSERT INTO edumaps_topics (${Object.keys(cols).join(', ')}) VALUES (${Object.values(cols).join(', ')});`);
  }
}
out.push('');

(data.changelog ?? []).forEach((c, idx) => {
  out.push(`INSERT INTO edumaps_changelog (date, text, sort) VALUES (${sqlStr(c.date)}, ${sqlStr(c.text)}, ${idx});`);
});
out.push('');

fs.mkdirSync(path.dirname(SEED), { recursive: true });
fs.writeFileSync(SEED, out.join('\n'), 'utf8');

console.log('정정 내역:');
for (const l of log) console.log(`  - ${l}`);
console.log(`\nseed 생성: ${path.relative(ROOT, SEED)} (장소 ${items.length}, 주제 ${items.reduce((n, i) => n + i.grade_topics.length, 0)}, 변경이력 ${data.changelog?.length ?? 0})`);

console.log(`\n[${target}] 스키마 적용…`);
d1ExecFile(SCHEMA, target);
// 원격에 이미 데이터가 있으면 덮어쓰지 않음(이관 후 수정분 보호)
if (target === '--remote' && !flags.has('force')) {
  const [{ n }] = d1Query('SELECT COUNT(*) AS n FROM edumaps_items', target);
  if (n > 0) {
    console.error(`원격 edumaps_items에 이미 ${n}건이 있습니다. seed가 전부 지우고 다시 채우므로 중단합니다(정말 필요하면 --force).`);
    process.exit(1);
  }
}
console.log(`[${target}] seed 적용…`);
d1ExecFile(SEED, target);

const [cnt] = d1Query(
  'SELECT (SELECT COUNT(*) FROM edumaps_items) AS items, (SELECT COUNT(*) FROM edumaps_topics) AS topics, (SELECT COUNT(*) FROM edumaps_changelog) AS changelog',
  target,
);
console.log(`완료: items ${cnt.items}, topics ${cnt.topics}, changelog ${cnt.changelog}`);
console.log(`다음: npm run data:publish -- ${target === '--local' ? '--local ' : ''}--dry-run`);
