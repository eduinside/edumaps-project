// 패치 SQL을 D1에 적용
// 사용: npm run data:apply -- data/patches/20261006-설명.sql [--local]
// 적용 후 npm run data:publish 로 resources.json 재생성.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, parseArgs, targetFlag, d1ExecFile } from './lib.mjs';

const { flags, positional } = parseArgs();
const target = targetFlag(flags);
const file = positional[0] && path.resolve(process.cwd(), positional[0]);

if (!file || !fs.existsSync(file)) {
  console.error('패치 파일을 지정하세요: npm run data:apply -- data/patches/YYYYMMDD-설명.sql [--local]');
  process.exit(1);
}

// 공유 DB 보호: edumaps_ 이외 테이블을 건드리는 문장은 거부
const sql = fs.readFileSync(file, 'utf8').replace(/--.*$/gm, '');
const touched = [...sql.matchAll(/\b(?:INTO|UPDATE|FROM|TABLE(?:\s+IF\s+(?:NOT\s+)?EXISTS)?|JOIN)\s+["`]?(\w+)/gi)].map((m) => m[1]);
const foreign = [...new Set(touched.filter((t) => !/^edumaps_/i.test(t)))];
if (foreign.length && !flags.has('force')) {
  console.error(`edumaps_ 이외 테이블이 보입니다: ${foreign.join(', ')}`);
  console.error('공유 DB(edu-link-db)이므로 거부합니다. 의도한 것이면 --force');
  process.exit(1);
}

console.log(`[${target}] ${path.relative(ROOT, file)} 적용…`);
try {
  const result = d1ExecFile(file, target);
  const list = Array.isArray(result) ? result : [result];
  // 원격은 meta.changes 제공, 로컬은 없음
  const changes = list.reduce((n, r) => n + (r?.meta?.changes ?? 0), 0);
  const hasMeta = list.some((r) => r?.meta && 'changes' in r.meta);
  console.log(`완료: 문장 ${list.length}개${hasMeta ? `, 변경된 행 ${changes}` : ''}`);
  if (list.some((r) => r?.results?.length)) console.log(JSON.stringify(list.flatMap((r) => r.results ?? []), null, 2));
  console.log(`다음: npm run data:publish -- ${target === '--local' ? '--local ' : ''}--dry-run 으로 확인 후 발행`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
