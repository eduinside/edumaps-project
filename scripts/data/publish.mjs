// D1(edumaps_*) → resources.json / public/data/resources.{json,csv} 발행
// 사용: npm run data:publish -- [--local] [--dry-run] [--commit [--push]]
//   기본 대상은 원격 D1. --dry-run은 검증·변경 요약만 출력하고 파일을 쓰지 않음.
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, RESOURCES_JSON, parseArgs, targetFlag, readAll, buildPayload, validate, kstNow, writeJsonLike, git,
} from './lib.mjs';

const { flags } = parseArgs();
const target = targetFlag(flags);
const dryRun = flags.has('dry-run');
const commit = flags.has('commit');
const push = flags.has('push');
if (push && !commit) {
  console.error('--push는 --commit과 함께 써야 합니다.');
  process.exit(1);
}

const PUBLIC_JSON = path.join(ROOT, 'public', 'data', 'resources.json');
const PUBLIC_CSV = path.join(ROOT, 'public', 'data', 'resources.csv');

console.log(`[${target}] D1 조회…`);
const rows = readAll(target);

// ── 검증
const { errors, warnings } = validate(rows);
if (warnings.length) {
  console.log(`\n경고 ${warnings.length}건:`);
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.error(`\n오류 ${errors.length}건 — 발행 중단:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n검증 통과');

// ── 생성
const generatedAt = kstNow();
const payload = buildPayload(rows, generatedAt);

// ── 변경 요약(직전 resources.json 대비)
const prev = fs.existsSync(RESOURCES_JSON) ? JSON.parse(fs.readFileSync(RESOURCES_JSON, 'utf8')) : { items: [], changelog: [] };
const summary = diffSummary(prev, payload);
console.log(`\n변경 요약 (이전 발행 ${prev.generatedAt ?? '-'} 대비):`);
console.log(summary.text || '  변경 없음');
console.log(`  합계: 장소 ${payload.items.length}, 활용 주제 ${payload.items.reduce((n, i) => n + i.grade_topics.length, 0)}, 변경이력 ${payload.changelog.length}`);

if (dryRun) {
  console.log('\n--dry-run: 파일을 쓰지 않았습니다.');
  process.exit(0);
}

// ── 쓰기
writeJsonLike(RESOURCES_JSON, payload);
writeJsonLike(PUBLIC_JSON, payload, { refFile: RESOURCES_JSON });
fs.mkdirSync(path.dirname(PUBLIC_CSV), { recursive: true });
fs.writeFileSync(PUBLIC_CSV, toCsv(payload.items), 'utf8');
console.log(`\n생성: src/data/resources.json, public/data/resources.json, public/data/resources.csv (generatedAt ${generatedAt})`);

if (commit) {
  const files = ['src/data/resources.json', 'public/data/resources.json', 'public/data/resources.csv'];
  git(['add', ...files]);
  git(['commit', '-m', `데이터 발행: ${generatedAt} (CLI)`, '--', ...files]);
  if (push) git(['push']);
  console.log(push ? '커밋·푸시 완료 → CF Pages가 자동 빌드합니다.' : '커밋 완료. 배포하려면 git push');
} else {
  console.log('\n다음 단계: 변경 확인(git diff) 후 npm run data:publish -- --commit --push');
}

// ── 보조 함수
function diffSummary(before, after) {
  const a = new Map(before.items.map((i) => [i.id, i]));
  const b = new Map(after.items.map((i) => [i.id, i]));
  const lines = [];
  const added = [...b.keys()].filter((id) => !a.has(id));
  const removed = [...a.keys()].filter((id) => !b.has(id));
  const changed = [];
  for (const [id, item] of b) {
    const old = a.get(id);
    if (!old) continue;
    const keys = new Set([...Object.keys(old), ...Object.keys(item)]);
    const fields = [...keys].filter((k) => JSON.stringify(old[k]) !== JSON.stringify(item[k]));
    if (fields.length) changed.push(`${id} ${item.title} (${fields.join(', ')})`);
  }
  const orderChanged =
    !added.length && !removed.length && before.items.map((i) => i.id).join() !== after.items.map((i) => i.id).join();
  if (added.length) lines.push(`  추가 ${added.length}: ${added.map((id) => `${id} ${b.get(id).title}`).join(', ')}`);
  if (removed.length) lines.push(`  삭제 ${removed.length}: ${removed.map((id) => `${id} ${a.get(id).title}`).join(', ')}`);
  if (changed.length) {
    lines.push(`  수정 ${changed.length}:`);
    for (const c of changed) lines.push(`    - ${c}`);
  }
  if (orderChanged) lines.push('  장소 순서 변경');
  if (JSON.stringify(before.changelog ?? []) !== JSON.stringify(after.changelog)) lines.push('  변경이력(changelog) 변경');
  return { text: lines.join('\n') };
}

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(items) {
  const header = ['id', 'type', 'title', 'category', 'tags', 'recommended_grade', 'description', 'lat', 'lng', 'external_url', 'image_url', 'topic_count'];
  const rowsOut = items.map((i) => [
    i.id, i.type, i.title, i.category, i.tags.join('|'), i.recommended_grade.join('|'), i.description,
    i.type === 'ONLINE' ? '' : i.location.lat, i.type === 'ONLINE' ? '' : i.location.lng,
    i.external_url, i.image_url, i.grade_topics.length,
  ]);
  // 엑셀 한글 깨짐 방지용 BOM
  return '﻿' + [header, ...rowsOut].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
