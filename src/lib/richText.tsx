import React from "react";

// 마크다운 링크 `[텍스트](URL)` 또는 맨 URL을 안전하게 <a> 태그로 변환한다.
// 보안을 위해 http/https 스킴만 링크로 처리하고, 그 외에는 원문 그대로 출력한다.
// (javascript: 등 위험한 스킴 차단, dangerouslySetInnerHTML 미사용)
const LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;

const linkClass =
  "text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 break-all";

/**
 * 문자열 안의 링크를 클릭 가능한 <a> 요소로 변환해 React 노드를 반환한다.
 * - `[보기](https://example.com)` → 텍스트가 "보기"인 링크
 * - `https://example.com` → URL 자체를 텍스트로 하는 링크
 * 링크가 없으면 원문 문자열을 그대로 반환한다.
 */
export function renderRichText(text: string | null | undefined): React.ReactNode {
  if (!text) return text ?? null;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const regex = new RegExp(LINK_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const [full, mdLabel, mdUrl, bareUrl] = match;

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const url = mdUrl ?? bareUrl;
    const label = mdLabel ?? bareUrl;
    nodes.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {label}
      </a>
    );

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  // 링크가 하나도 없으면 원문 문자열을 그대로 반환
  return nodes.length === 0 ? text : nodes;
}
