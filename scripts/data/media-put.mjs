// 이미지 → WebP 변환 후 R2(edulink-pages-media/edumaps/) 업로드
// 사용: npm run media:put -- <이미지 파일> [--name res_201] [--force] [--dry-run]
//   dgedu.link/media/*는 1년 immutable 캐시 → 교체는 새 이름(res_131_v2)으로 올리고 image_url 변경.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { MEDIA_BASE, parseArgs, runWrangler } from './lib.mjs';

const BUCKET = 'edulink-pages-media';
const MAX_WIDTH = 1200;
const QUALITY = 80;

const { flags, opts, positional } = parseArgs();
const src = positional[0] && path.resolve(process.cwd(), positional[0]);
if (!src || !fs.existsSync(src)) {
  console.error('이미지 파일을 지정하세요: npm run media:put -- <파일> [--name res_201] [--dry-run]');
  process.exit(1);
}
const name = opts.name || path.basename(src, path.extname(src));
if (!/^[A-Za-z0-9_-]+$/.test(name)) {
  console.error(`이름은 영문·숫자·_·- 만 쓸 수 있습니다: ${name}`);
  process.exit(1);
}
const key = `edumaps/${name}.webp`;
const publicUrl = `${MEDIA_BASE}${name}.webp`;

// 같은 이름이 이미 공개돼 있으면 거부(캐시 때문에 덮어써도 갱신 안 됨)
try {
  const res = await fetch(publicUrl, { method: 'HEAD' });
  if (res.ok && !flags.has('force')) {
    console.error(`이미 있는 이름입니다: ${publicUrl}`);
    console.error(`캐시 때문에 덮어써도 방문자에게 반영되지 않습니다. 새 이름을 쓰세요: --name ${nextName(name)}`);
    process.exit(1);
  }
} catch {
  console.warn('기존 파일 확인 실패(네트워크) — 계속 진행');
}

// 변환
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'edumaps-media-')), `${name}.webp`);
const info = await sharp(src)
  .rotate()
  .resize({ width: MAX_WIDTH, withoutEnlargement: true })
  .webp({ quality: QUALITY })
  .toFile(tmp);
const kb = (n) => `${Math.round(n / 1024)}KB`;
console.log(`변환: ${path.basename(src)} (${kb(fs.statSync(src).size)}) → ${name}.webp ${info.width}×${info.height} (${kb(info.size)})`);

if (flags.has('dry-run')) {
  console.log(`--dry-run: 업로드하지 않음. 변환 결과: ${tmp}`);
  process.exit(0);
}

// 업로드(원격 R2)
const res = runWrangler(
  ['r2', 'object', 'put', `${BUCKET}/${key}`, '--file', tmp, '--content-type', 'image/webp', '--remote'],
  { inherit: true },
);
fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
if (res.status !== 0) {
  console.error('업로드 실패');
  process.exit(1);
}
console.log(`\n업로드 완료: ${publicUrl}`);
if (/^res_\d+$/.test(name)) console.log('장소 id와 같은 이름이면 image_url은 NULL(기본값)로 두면 됩니다.');
else console.log(`패치 예: UPDATE edumaps_items SET image_url = '${publicUrl}', updated_at = datetime('now') WHERE id = '<id>';`);

function nextName(n) {
  const m = n.match(/^(.*)_v(\d+)$/);
  return m ? `${m[1]}_v${Number(m[2]) + 1}` : `${n}_v2`;
}
