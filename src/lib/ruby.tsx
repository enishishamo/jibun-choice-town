// Selective furigana (language-style.md §2): content strings may mark ruby as
// ｜漢字《かんじ》 (or 漢字《かんじ》 directly after a kanji run). withRuby()
// renders them as <ruby> elements. Plain strings pass through untouched, so
// existing copy needs no migration.
import type { ReactNode } from "react";

const RUBY_RE = /｜?([一-鿿々々]+)《([^》]+)》/g;

export function withRuby(text: string): ReactNode {
  if (!text.includes("《")) return text;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  RUBY_RE.lastIndex = 0;
  while ((m = RUBY_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <ruby key={m.index}>
        {m[1]}
        <rt>{m[2]}</rt>
      </ruby>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Strip ruby markup for plain-text contexts (aria labels, logs). */
export function stripRuby(text: string): string {
  return text.replace(RUBY_RE, "$1");
}
