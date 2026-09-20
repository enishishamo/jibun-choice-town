// JIBUN CHOICE Ver.2 (PLAY FIRST) — root shell.
//
// 2026-09-20: development scaffold only. No world, companion, item or game
// is implemented here yet; nothing visual is decided (see
// docs/jibun-choice-v2/OPEN_DECISIONS.md). The first game to be built is
// 給食 WORLD「栄養・メニュー」under src/v2/games/ — see src/v2/README.md.
//
// Progress storage: Ver.2 must NOT read or write Ver.1's localStorage key
// ("jibun-choice-progress-v1") until T-03 is decided.
//
// TEMP_IMPLEMENTATION_ONLY: every string and style on this screen is a
// technical placeholder written by Claude Code, not an approved design
// (docs/jibun-choice-v2/DESIGN_OWNERSHIP.md §2). It must be replaced by the
// GPT-designed, Human-approved screen before anything here goes PUBLIC.
export default function V2App() {
  return (
    <main className="v2-shell">
      <p className="v2-shell-badge">TEMP_IMPLEMENTATION_ONLY — Ver.2 開発用エントリ</p>
      <h1 className="v2-shell-title">JIBUN CHOICE</h1>
      <p className="v2-shell-line">PLAY FIRST — まだ何も実装されていません。</p>
      <p className="v2-shell-note">
        仕様: <code>docs/jibun-choice-v2/</code> ／ 最初のゲーム: 給食WORLD「栄養・メニュー」
      </p>
      <a className="v2-shell-link" href={import.meta.env.BASE_URL}>
        Ver.1（公開版と同じ内容）を開く
      </a>
    </main>
  );
}
