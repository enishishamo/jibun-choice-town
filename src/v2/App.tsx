// JIBUN CHOICE Ver.2 (PLAY FIRST) — root shell.
//
// TEMP_IMPLEMENTATION_ONLY: this screen is a development scaffold. The TOP /
// overall-map lane owns the real entry. Strings: src/v2/copy.ts (shell) and
// src/v2/lunch/copy.ts (slice). Ver.2 never touches Ver.1's localStorage key.
import LunchWorldApp from "./lunch/LunchWorldApp";
import { SHELL_COPY } from "./copy";

export default function V2App() {
  // dev switch: /v2.html#lunch mounts the 給食 WORLD vertical slice directly
  if (window.location.hash === "#lunch") return <LunchWorldApp />;
  return (
    <main className="v2-shell">
      <p className="v2-shell-badge">{SHELL_COPY.badge}</p>
      <h1 className="v2-shell-title">{SHELL_COPY.title}</h1>
      <p className="v2-shell-line">{SHELL_COPY.line}</p>
      <p className="v2-shell-note">{SHELL_COPY.note}</p>
      <a className="v2-shell-link" href="#lunch" onClick={() => setTimeout(() => window.location.reload(), 0)}>
        {SHELL_COPY.lunchLink}
      </a>
      <a className="v2-shell-link" href={import.meta.env.BASE_URL}>{SHELL_COPY.ver1Link}</a>
    </main>
  );
}
