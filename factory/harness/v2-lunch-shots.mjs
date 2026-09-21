#!/usr/bin/env node
// Real-device-shaped playthrough of the Ver.2 栄養教諭 Job Vertical Slice at
// 375x812 (real Chrome via puppeteer-core), driven by REAL taps and gestures.
// Captures the 16 states the Visual Review asks for, and fails on any console
// error, page error, 4xx/5xx or horizontal overflow.
//
// The play path is not arbitrary: it is the sequence the pure-logic harness
// proves exists — a menu that is one axis off, a single swap that fixes it, a
// delivery trouble with several ways back, and a different menu to recover.
// Usage: npm run shots:v2-lunch [-- --base <url>] [-- --out <dir>]
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { tmpdir } from "node:os";

// The allow-list of everything a child may ever read comes from copy.ts itself,
// so a string invented in a component cannot slip past: anything rendered that
// is not in here fails the run.
const vite = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, appType: "custom", logLevel: "error", cacheDir: `${tmpdir()}/jc-vite-cache-v2-lunch` });
const { COPY } = await vite.ssrLoadModule("/src/v2/lunch/copy.ts");
await vite.close();
const ALLOWED = new Set();
const collect = (v) => {
  if (typeof v === "string") ALLOWED.add(v.trim());
  else if (typeof v === "function") {
    // expand every template with every value the slice can actually pass it, so
    // the allow-list is what copy.ts can produce, not a hand-written list
    for (const n of [...Object.values(COPY.play.dish), ...Object.values(COPY.play.slotPlace)]) collect(v(n));
  }
  else if (v && typeof v === "object") for (const x of Object.values(v)) collect(x);
};
collect(COPY);
// multi-line copy is rendered as one node; index each line too
for (const s of [...ALLOWED]) for (const line of s.split("\n")) ALLOWED.add(line.trim());

const argOf = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const BASE = argOf("--base", "http://localhost:5177/jibun-choice-town/");
const OUT = argOf("--out", "factory/state/art/shots/v2-lunch");
const CHROME = process.env.JC_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${String(e)}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`));

// Everything the page ever renders is accumulated, because a score that flashes
// for 380ms during a dish flight, or a verdict that shows only during a 900ms
// celebration, is invisible to a screenshot taken between them.
await page.evaluateOnNewDocument(() => {
  window.__seen = { board: new Set(), boardAria: new Set(), all: new Set(), aria: new Set(), duringPlay: new Set() };
  // Two display channels cannot be found by looking at the DOM after the fact,
  // because nothing is left to look at: a value assigned to a form control
  // through its PROPERTY (no attribute changes, so no mutation fires) and text
  // painted into a canvas (no node at all). Both are recorded at the moment they
  // happen, by wrapping the API that does it.
  window.__sideChannel = new Set();
  const note = (v) => { const t = String(v ?? "").trim(); if (t) { window.__sideChannel.add(t); window.__seen.all.add(t); } };
  for (const [Ctor, prop] of [[HTMLInputElement, "value"], [HTMLTextAreaElement, "value"], [HTMLSelectElement, "value"], [HTMLOptionElement, "text"]]) {
    const d = Object.getOwnPropertyDescriptor(Ctor.prototype, prop);
    if (!d || !d.set) continue;
    Object.defineProperty(Ctor.prototype, prop, { ...d, set(v) { note(v); d.set.call(this, v); } });
  }
  for (const m of ["fillText", "strokeText"]) {
    const orig = CanvasRenderingContext2D.prototype[m];
    CanvasRenderingContext2D.prototype[m] = function (t, ...rest) { note(t); return orig.call(this, t, ...rest); };
  }
  // an open shadow root is a second document the walkers below cannot enter
  // unless they are handed the root itself, so keep every one that is created
  window.__roots = [];
  const attach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) { const r = attach.call(this, init); if (init && init.mode === "open") window.__roots.push(r); return r; };

  const record = () => {
    const board = document.querySelector(".lmp");
    const before = new Set();
    const inBoard = (e) => board && (board.contains(e) || (e.getRootNode && board.contains(e.getRootNode().host)));
    const add = (v, e) => {
      const t = String(v ?? "").trim();
      if (!t) return;
      window.__seen.all.add(t); before.add(t);
      if (inBoard(e)) window.__seen.board.add(t);
    };
    const roots = [document.body, ...window.__roots.filter((r) => r.host && r.host.isConnected)];
    for (const root of roots) {
      const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = it.nextNode(); n; n = it.nextNode()) add(n.textContent, n.parentElement);
      for (const e of root.querySelectorAll("*")) {
        // generated content is on screen but is not a text node: a score written
        // as `content: "100てん"` would otherwise never be looked at. ::marker is
        // in the list because a list item's bullet is generated content too.
        for (const which of ["::before", "::after", "::marker"]) {
          const c = getComputedStyle(e, which).content;
          if (!c || c === "none" || c === "normal") continue;
          add(c.replace(/^["']|["']$/g, ""), e);
        }
        // everything else a child can read or a screen reader can say, and that
        // lives in an attribute or a property rather than in a text node
        // only controls that actually SHOW a value. `li.value` is its ordinal
        // and `button.value` is form data; neither is on screen, and reading
        // them would fail the run on text no child ever sees.
        if (e.matches("input, textarea, select, output, progress, meter, [contenteditable]")) add(e.value ?? e.textContent, e);
        for (const a of ["alt", "title", "placeholder", "aria-valuetext", "aria-valuenow", "aria-roledescription"]) {
          if (e.hasAttribute && e.hasAttribute(a)) add(e.getAttribute(a), e);
        }
        if (e.hasAttribute && e.hasAttribute("aria-label")) {
          const l = e.getAttribute("aria-label");
          window.__seen.aria.add(l);
          before.add(l);
          if (inBoard(e)) window.__seen.boardAria.add(l);
        }
      }
    }
    // anything on screen while the board is mounted is being shown DURING play
    if (board) {
      for (const t of before) window.__seen.duringPlay.add(t);
      for (const t of window.__sideChannel) { window.__seen.board.add(t); window.__seen.duringPlay.add(t); }
    }
  };
  // record() reads generated content for every element, so it must not run once
  // per mutation during an animation: coalesce to at most one pass per 30ms,
  // always with a trailing pass so the last state of a burst is still seen.
  let last = 0, pending = 0;
  const schedule = () => {
    const now = Date.now();
    if (now - last >= 30) { last = now; record(); return; }
    if (pending) return;
    pending = setTimeout(() => { pending = 0; last = Date.now(); record(); }, 30);
  };
  window.__record = record;
  const start = () => {
    record();
    // class and style are watched too, not just aria-label: a score written as
    // `.lmp.is-settled::before { content: "100てん" }` appears and disappears
    // through a CLASS change alone, with no node added and no text edited, so an
    // aria-only filter would never re-scan while it is on screen.
    new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true });
    // and a sweep on a timer, because a node that is inserted and removed
    // between two mutations of its own is still a thing the child saw
    setInterval(record, 80);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
});

await page.goto(`${BASE}v2.html`, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.removeItem("jibun-choice:v2:progress"));
await page.reload({ waitUntil: "networkidle0" });

const shots = [];
const violations = [];
// report each violation the moment it is found: if the run later throws (a
// tap-stealing overlay makes a button unreachable, say), the findings are not lost
const flag = (m) => { violations.push(m); console.error("VIOLATION:", m); };
let revealed = false; // the job name may not appear anywhere before CLEAR
/** Every capture is also an assertion: no developer marker, no job name before
 * the reveal, no digit on the board, and no string that is not in copy.ts. */
const shot = async (name) => {
  const p = `${OUT}/${name}.png`;
  await page.screenshot({ path: p });
  shots.push(p);
  const seen = await page.evaluate(() => {
    const texts = [];
    const walk = (root) => {
      const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = it.nextNode(); n; n = it.nextNode()) { const t = n.textContent.trim(); if (t) texts.push(t); }
    };
    walk(document.body);
    for (const r of window.__roots || []) if (r.host && r.host.isConnected) walk(r);
    const board = document.querySelector(".lmp");
    // innerText covers neither what a form control displays nor what was painted
    // into a canvas or assigned through a property
    const vals = [...document.querySelectorAll("input, textarea, select, output, progress, meter, [contenteditable]")]
      .map((e) => String(e.value ?? e.textContent ?? "").trim()).filter(Boolean);
    texts.push(...vals, ...(window.__sideChannel ? [...window.__sideChannel] : []));
    const inBoard = board ? [...board.querySelectorAll("input, textarea, select, output, progress, meter, [contenteditable]")]
      .map((e) => String(e.value ?? e.textContent ?? "").trim()).filter(Boolean) : [];
    const boardText = board ? `${board.innerText} ${inBoard.join(" ")} ${(window.__sideChannel ? [...window.__sideChannel] : []).join(" ")}` : "";
    const aria = [...document.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label"));
    return { texts, boardText, aria, body: document.body.innerText };
  });
  if (/TEMP_IMPLEMENTATION_ONLY|DESIGN_NEEDED|DN-\d+/.test(seen.body)) flag(`${name}: developer marker on screen`);
  if (!revealed && /栄養教諭|栄養士|学校栄養職員/.test(seen.body)) flag(`${name}: the job is named before CLEAR`);
  if (/[0-9０-９]/.test(seen.boardText)) flag(`${name}: a number is shown on the board — "${seen.boardText.replace(/\s+/g, " ").slice(0, 80)}"`);
  for (const t of seen.texts) if (!ALLOWED.has(t)) flag(`${name}: text not in copy.ts — "${t}"`);
  for (const a of seen.aria) {
    const bare = a.replace(/（.*?）|：.*$/g, "").trim();
    if (!ALLOWED.has(a) && !ALLOWED.has(bare)) flag(`${name}: aria-label not in copy.ts — "${a}"`);
  }
  console.log("shot", p);
};
/** tap by accessible name (exact, then prefix) — the flow must be reachable by an AT user too */
const tap = async (label, settle = 260) => {
  let h = await page.$(`button[aria-label="${label}"]`);
  if (!h) {
    for (const b of await page.$$("button")) {
      const [al, txt] = await b.evaluate((e) => [e.getAttribute("aria-label") ?? "", e.textContent.trim()]);
      if (al === label || al.startsWith(label) || txt === label || txt.startsWith(label)) { h = b; break; }
    }
  }
  if (!h) throw new Error(`no button for "${label}"`);
  await h.tap();
  await sleep(settle);
};
/** swipe the tray upward — the in-world way to send the lunch off */
const swipeTrayUp = async () => {
  const box = await (await page.$(".lmp-tray")).boundingBox();
  const cx = Math.round(box.x + box.width / 2), cy = Math.round(box.y + box.height / 2);
  await page.touchscreen.touchStart(cx, cy);
  await page.touchscreen.touchMove(cx, cy - 40);
  await page.touchscreen.touchMove(cx, cy - 90);
  await page.touchscreen.touchEnd();
};
const beads = () => page.$$eval(".lmp-bead", (bs) => bs.map((b) => ({ axis: b.getAttribute("data-bead"), band: [...b.classList].find((c) => c.startsWith("band-")) })));

// ── no control may steal a tap meant for another ─────────────────────────
//    (a dish's picture is allowed to overflow its recess; its touch area is not)
const checkTouchGeometry = async (where, pg = page) => {
  const r = await pg.evaluate(() => {
  const wrong = [];
  const all = [...document.querySelectorAll(".lmp-slot, .lmp-school, .lmp-cand")];
  // a control that is deliberately not touchable (disabled, or pointer-events:none)
  // is not expected to own the pixels it is drawn on
  const boxes = all.filter((el) => !el.disabled && getComputedStyle(el).pointerEvents !== "none");
  for (const el of boxes) {
    const b = el.getBoundingClientRect();
    if (b.width === 0) continue;
    // sampled inside the rounded shape, not at the square corners, which a
    // rounded control legitimately does not occupy
    const px = (fx, fy) => [b.left + b.width * fx, b.top + b.height * fy];
    for (const [x, y] of [px(0.25, 0.25), px(0.75, 0.25), px(0.25, 0.75), px(0.75, 0.75), px(0.5, 0.5)]) {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) { wrong.push(`${el.getAttribute("aria-label")} is drawn partly outside the viewport @${Math.round(x)},${Math.round(y)}`); continue; }
      const hit = document.elementFromPoint(x, y);
      // the point must land on this control or something inside it. Another
      // control, a transparent overlay, or nothing at all all mean the same
      // thing: the child cannot touch it where they can see it.
      // only this control or something inside it counts: a tap that lands on a
      // container never reaches the control's handler, however innocent the
      // container looks
      if (!(hit && (hit === el || el.contains(hit)))) {
        const other = hit && hit.closest ? hit.closest(".lmp-slot, .lmp-school, .lmp-cand") : null;
        wrong.push(`${el.getAttribute("aria-label")} @${Math.round(x)},${Math.round(y)} -> ${other ? other.getAttribute("aria-label") : hit ? (hit.className || hit.tagName) : "nothing"}`);
      }
    }
  }
  // and no two touch areas may intersect at all
  const overlaps = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i].getBoundingClientRect(), c = boxes[j].getBoundingClientRect();
    if (a.width === 0 || c.width === 0) continue;
    const w = Math.min(a.right, c.right) - Math.max(a.left, c.left), h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
    if (w > 0 && h > 0) overlaps.push(`${boxes[i].getAttribute("aria-label")} x ${boxes[j].getAttribute("aria-label")}: ${Math.round(w)}x${Math.round(h)}`);
  }
  const tooSmall = boxes.filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); })
    .map((el) => { const r = el.getBoundingClientRect(); return `${el.getAttribute("aria-label")} ${Math.round(r.width)}x${Math.round(r.height)}`; });
  return { wrong, overlaps, tooSmall, counted: boxes.filter((b) => b.getBoundingClientRect().width > 0).length };
  });
  // a geometry check that found nothing to check has proved nothing
  if (r.counted < 10) flag(`touch geometry at "${where}": only ${r.counted} controls were on screen — the check was vacuous`);
  for (const w of r.wrong) flag(`tap ownership at "${where}": ${w}`);
  for (const o of r.overlaps) flag(`touch areas overlap at "${where}": ${o}`);
  for (const s of r.tooSmall) flag(`touch target smaller than 44x44 at "${where}": ${s}`);
};


// ── the whole loop must still be playable with motion turned off ─────────
//    (the beads and the flying dishes carry meaning, so this is not cosmetic)
{
  const rm = await browser.newPage();
  await rm.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await rm.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  const rmErrors = [];
  rm.on("pageerror", (e) => rmErrors.push(String(e)));
  rm.on("console", (m) => { if (m.type() === "error") rmErrors.push(m.text()); });
  await rm.goto(`${BASE}v2.html`, { waitUntil: "networkidle0" });
  await rm.evaluate(() => localStorage.removeItem("jibun-choice:v2:progress"));
  await rm.reload({ waitUntil: "networkidle0" });
  const rmTap = async (label, settle = 400) => {
    for (const b of await rm.$$("button")) {
      const al = await b.evaluate((e) => e.getAttribute("aria-label") ?? "");
      if (al === label || al.startsWith(label)) { await b.tap(); await sleep(settle); return true; }
    }
    return false;
  };
  // exact match only: 「さけのしおやき」 is a prefix of 「さけのしおやき（おぼんから もどす）」,
  // so a prefix match would take a dish OFF the tray when we meant to put one on
  const rmTapExact = async (label, settle = 400) => {
    for (const b of await rm.$$("button")) {
      if ((await b.evaluate((e) => e.getAttribute("aria-label") ?? "")) === label) { await b.tap(); await sleep(settle); return true; }
    }
    return false;
  };
  const rmSendable = () => rm.evaluate(() => !!document.querySelector(".lmp-school.ready"));
  await rmTap("こんだてを考える", 700);
  for (const d of ["パン", "さけのしおやき", "やさいのごまあえ", "ポテトサラダ"]) await rmTapExact(d, 700);
  const state = await rm.evaluate(() => ({
    sendable: !!document.querySelector(".lmp-school.ready"),
    // nothing may be left running when motion is off
    running: [...document.querySelectorAll(".lmp *")].filter((e) => getComputedStyle(e).animationName !== "none").map((e) => e.className).slice(0, 5),
  }));
  if (!state.sendable) flag("with reduced motion the menu could not be completed to a sendable state");
  if (state.running.length) flag(`with reduced motion these are still animating: ${state.running.join(", ")}`);

  // …and the rest of the journey, which is where motion actually carries the
  // meaning: the interception, the dish that did not arrive, the rebuild, the
  // second delivery and the reveal. Stopping at "sendable" proved none of it.
  if (state.sendable) {
    await rmTapExact(COPY.play.send, 2600); // the accessible equivalent of the swipe
    const lost = await rm.evaluate(() => {
      const b = [...document.querySelectorAll(".lmp-cand.gone")][0];
      return b ? b.getAttribute("aria-label") : null;
    });
    if (!lost) flag("with reduced motion the first send did not produce a delivery trouble");
    // rebuild generically: try each dish that is still choosable — not already
    // on the tray, not the one that failed to arrive — and keep the one that
    // brings the school back, taking the others off again
    const choosable = () => rm.$$eval(".lmp-cand", (bs) => bs
      .filter((b) => !b.classList.contains("gone") && !b.classList.contains("on-tray"))
      .map((b) => b.getAttribute("aria-label")));
    // 1600ms per try: the beads still travel to their grooves with motion off
    // (only the decorative CSS animation is dropped), and the school is offered
    // from where the beads are DRAWN, so reading sooner reads a bead in transit
    for (const n of await choosable()) {
      if (await rmSendable()) break;
      if (!(await rmTapExact(n, 1600))) continue;
      if (await rmSendable()) break;
      await rmTapExact(COPY.play.onTray(n), 800);
    }
    if (!(await rmSendable())) flag("with reduced motion the menu could not be rebuilt after the delivery trouble");
    else {
      await rmTapExact(COPY.play.send, 3200);
      const done = await rm.evaluate(() => ({ left: !document.querySelector(".lmp"), body: document.body.innerText }));
      if (!done.left || !done.body.includes("栄養教諭")) {
        flag(`with reduced motion the second send did not reach the job reveal — board gone: ${done.left}`);
      }
    }
  }
  if (rmErrors.length) flag(`reduced-motion run had console errors: ${rmErrors[0]}`);
  await rm.close();
}

// ── the slice claims five phone sizes; assert them instead of claiming ───
//    Vertical fit matters as much as horizontal: a board that scrolls hides the
//    counter, and a child who cannot see a dish cannot choose it.
for (const [w, h] of [[320, 568], [375, 667], [375, 812], [390, 844], [430, 932]]) {
  const vp = await browser.newPage();
  await vp.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const vpErrors = [];
  vp.on("pageerror", (e) => vpErrors.push(String(e)));
  await vp.goto(`${BASE}v2.html`, { waitUntil: "networkidle0" });
  await vp.evaluate(() => localStorage.removeItem("jibun-choice:v2:progress"));
  await vp.reload({ waitUntil: "networkidle0" });
  const vpTap = async (label, settle = 350, exact = true) => {
    for (const b of await vp.$$("button")) {
      const al = await b.evaluate((e) => e.getAttribute("aria-label") ?? "");
      if (al === label || (!exact && al.startsWith(label))) { await b.tap(); await sleep(settle); return true; }
    }
    return false;
  };
  // the map spot carries its state in its name 「こんだてを考える（いま こまっている）」
  if (!(await vpTap("こんだてを考える", 700, false))) flag(`${w}x${h}: the こんだて spot could not be opened`);
  for (const label of ["empty tray", "tray full"]) {
    if (label === "tray full") for (const d of ["パン", "さけのしおやき", "やさいのごまあえ", "ポテトサラダ"]) await vpTap(d, 500);
    await sleep(400);
    const fit = await vp.evaluate(() => {
      const de = document.documentElement;
      const cands = [...document.querySelectorAll(".lmp-cand")];
      const offscreen = cands.filter((e) => { const r = e.getBoundingClientRect(); return r.width === 0 || r.bottom > innerHeight + 1 || r.top < -1 || r.right > innerWidth + 1 || r.left < -1; })
        .map((e) => e.getAttribute("aria-label"));
      return { scrollW: de.scrollWidth, scrollH: de.scrollHeight, innerW: innerWidth, innerH: innerHeight, dishes: cands.length, offscreen };
    });
    // The rack is the only thing on the board that has to be read rather than
    // touched, so it needs its own geometry check: four channels that tile the
    // block. A part of one channel drawn over another channel's name is how the
    // rack looked at 320x568 before this check existed.
    const rack = await vp.evaluate(() => {
      const r = document.querySelector(".lmp-rack");
      if (!r) return null;
      const rb = r.getBoundingClientRect();
      const rows = [...document.querySelectorAll(".lmp-groove")].map((g) => ({
        axis: [...g.classList].find((c) => c !== "lmp-groove"),
        name: g.querySelector(".lmp-groove-name")?.getBoundingClientRect().toJSON(),
        parts: ["-track", "-hollow", "-lip"].map((s) => g.querySelector(`.lmp-groove${s}`)?.getBoundingClientRect().toJSON())
          .concat([g.querySelector(".lmp-bead")?.getBoundingClientRect().toJSON()]).filter(Boolean),
      }));
      const hit = (a, b) => a && b && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5
        && Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5;
      const bad = [];
      for (const row of rows) {
        for (const other of rows) {
          if (other === row) continue;
          for (const p of other.parts) if (hit(row.name, p)) bad.push(`${other.axis} covers the ${row.axis} name`);
        }
        for (const p of row.parts) {
          if (p.top < rb.top - 0.5 || p.bottom > rb.bottom + 0.5) bad.push(`${row.axis} is drawn outside the block`);
        }
        if (row.name && (row.name.top < rb.top - 0.5 || row.name.bottom > rb.bottom + 0.5)) bad.push(`the ${row.axis} name is drawn outside the block`);
      }
      return { rows: rows.length, bad: [...new Set(bad)] };
    });
    const at = `${w}x${h}, ${label}`;
    if (!rack || rack.rows !== 4) flag(`${at}: the rack has ${rack ? rack.rows : "no"} channels, expected 4`);
    else for (const b of rack.bad) flag(`rack at "${at}": ${b}`);
    if (fit.scrollW > fit.innerW) flag(`${at}: the page scrolls sideways (${fit.scrollW} > ${fit.innerW})`);
    if (fit.scrollH > fit.innerH + 1) flag(`${at}: the board does not fit vertically (${fit.scrollH} > ${fit.innerH})`);
    if (fit.dishes !== 9) flag(`${at}: ${fit.dishes} dishes on the counter, expected 9`);
    if (fit.offscreen.length) flag(`${at}: dishes off screen — ${fit.offscreen.join(", ")}`);
    await checkTouchGeometry(at, vp);
  }
  if (vpErrors.length) flag(`${w}x${h}: console errors — ${vpErrors[0]}`);
  await vp.close();
}

// ── 01 START ─────────────────────────────────────────────────────────────
await shot("01-world-map");
await tap("こんだてを考える", 700);
await shot("02-play-start");
await checkTouchGeometry("play, empty tray");

// ── 02 one or two dishes placed ──────────────────────────────────────────
// every axis must visibly answer the very first dish, however small its share:
// a 2px slide is not an answer, so each bead is struck as its mote lands
{
  const h = await page.$('button[aria-label="パン"]');
  await h.tap();
  let everStruck = new Set();
  for (let i = 0; i < 40; i++) {
    for (const a of await page.$$eval(".lmp-bead.struck", (bs) => bs.map((b) => b.getAttribute("data-bead")))) everStruck.add(a);
    await sleep(50);
  }
  if (everStruck.size !== 4) flag(`only ${everStruck.size}/4 beads answered the first dish (${[...everStruck].join(",")})`);
  await sleep(300);
}
await shot("03-one-placed");
await tap("さけのしおやき", 700);
await shot("04-two-placed");

// ── 03 four dishes, one axis still off ───────────────────────────────────
await tap("やさいのごまあえ");
await tap("ごはん", 1400);
await shot("05-four-placed");
const before = await beads();

// ── 04 swapping one dish while watching the beads ────────────────────────
// two staples is too much energy: take the rice back off the tray and put a
// side dish in instead (tapping a dish on the tray returns it to the counter)
await tap("ごはん（おぼんから もどす）", 600);
await shot("06-swapping");
await tap("ポテトサラダ", 1600);
await shot("07-after-swap");
const after = await beads();

// ── 05 the first "it came together" ──────────────────────────────────────
await shot("08-settled");
await checkTouchGeometry("play, tray full and the school offered");

// ── the game must never play itself ──────────────────────────────────────
//    The tray is sendable and nothing is touched for 3.5s. A build that
//    advances here is one where the child is a spectator.
{
  const before = await page.evaluate(() => document.querySelector(".lmp")?.className ?? "");
  await sleep(3500);
  const after = await page.evaluate(() => ({ cls: document.querySelector(".lmp")?.className ?? "", left: !document.querySelector(".lmp") }));
  if (after.left || !/phase-build/.test(after.cls) || before !== after.cls) {
    flag(`the game advanced with no input: "${before}" -> "${after.cls}"${after.left ? " (left the board entirely)" : ""}`);
  }
}

// ── 06 EVENT: the first send is intercepted ──────────────────────────────
await swipeTrayUp();
await sleep(900);
await shot("09-event-truck");
await sleep(1200);
await shot("10-event-after");

// ── 07 the dish that did not arrive ──────────────────────────────────────
await tap("さけのしおやき（とどかなかった）", 140);
await shot("11-unavailable-shake");

// ── 08/09 rebuild: try the fried chicken, see it push two beads out, take it
//    back off and try the soup instead ─────────────────────────────────────
await tap("とりのからあげ", 1500);
await shot("12-rebuilding");
await tap("とりのからあげ（おぼんから もどす）", 600); // on the tray: tapping it sends it back
await tap("とうふのみそしる", 1600);
await shot("13-rebuilt");

// ── 10 the lunch reaches the school ──────────────────────────────────────
await swipeTrayUp();
await sleep(800);
await shot("14-delivering");
await sleep(1400);

// ── 11 JOB REVEAL ────────────────────────────────────────────────────────
revealed = true; // from here on the job may be named
await shot("15-job-reveal-lead");
await sleep(2400);
await shot("16-job-reveal");

// ── 12/13 KNOW THE JOB ───────────────────────────────────────────────────
await tap("この仕事を のぞいてみる", 700);
await shot("17-know-the-job");
await tap("給食をつくる", 500);
await shot("18-know-scene-open");

// ── 14 CAREER PATH ───────────────────────────────────────────────────────
await tap("どうやって なる？", 700);
await shot("19-career-path");
await tap("もどる", 600);

// ── 15 好きの種 ───────────────────────────────────────────────────────────
await tap("つぎへ", 700);
await shot("20-seed");
await tap("予定が変わって考え直す", 400);
await shot("21-seed-picked");

// ── 16 WORLD RETURN ──────────────────────────────────────────────────────
await tap("ちずへ", 1200);
await shot("22-world-return");
await sleep(1200);
await shot("23-next-trouble");


// ── the one structural rule besides the four axes: a lunch needs a 主食.
//    Played on a fresh visit so the state is unambiguous.
await tap("こんだてを考える", 700);
for (const d of ["さけのしおやき", "やさいのごまあえ", "ポテトサラダ", "とうふのみそしる"]) await tap(d);
await sleep(1500);
await shot("24-no-staple");
const noStaple = await page.evaluate(() => ({
  stapleShelfAsks: !!document.querySelector(".lmp-shelf.wanted"),
  schoolOffered: !!document.querySelector(".lmp-school.ready"),
}));
if (!noStaple.stapleShelfAsks || noStaple.schoolOffered) {
  flag(`24-no-staple: a tray with no 主食 must not be sendable and the 主食 pan must ask — got ${JSON.stringify(noStaple)}`);
}

// ── the accumulated record, not the snapshots ────────────────────────────
const seen = await page.evaluate(() => ({
  board: [...window.__seen.board],
  boardAria: [...window.__seen.boardAria],
  all: [...window.__seen.all],
  aria: [...window.__seen.aria],
  duringPlay: [...window.__seen.duringPlay],
}));
for (const t of [...seen.board, ...seen.boardAria]) if (/[0-9０-９]/.test(t)) flag(`a number was shown on the board at some point — "${t}"`);
for (const t of seen.all) if (!ALLOWED.has(t)) flag(`text rendered at some point is not in copy.ts — "${t}"`);
for (const a of seen.aria) {
  if (ALLOWED.has(a)) continue; // the exact string copy.ts produces
  // otherwise it may only be two allowed pieces joined by the slice's own two shapes,
  // 「<name>（<state>）」 and 「<name>：<state>」 — nothing may be invented in between
  const bare = a.replace(/（[^）]*）$/, "").replace(/：[^：]*$/, "").trim();
  const suffix = ((a.match(/（([^）]*)）$/)?.[1] ?? "") + (a.match(/：(.*)$/)?.[1] ?? "")).trim();
  if (!(suffix && ALLOWED.has(bare) && ALLOWED.has(suffix))) {
    flag(`aria-label rendered at some point is not in copy.ts — "${a}"`);
  }
}
// the job may not be named anywhere while the child is still playing
for (const t of seen.duringPlay) if (/栄養教諭|学校栄養職員|栄養士/.test(t)) flag(`the job was named while the board was still on screen — "${t}"`);

// every <img> the flow rendered must be a real, loaded picture — a CSS fallback
// carries no text and returns no 4xx, so the marker grep alone cannot see it
const brokenImages = await page.evaluate(() =>
  [...document.querySelectorAll("img")].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
);
const info = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  innerW: window.innerWidth,
  progress: localStorage.getItem("jibun-choice:v2:progress"),
  // no developer marker may be visible anywhere in the finished flow
  markers: /TEMP_IMPLEMENTATION_ONLY|DESIGN_NEEDED|DN-\d+/.test(document.body.innerText),
}));
const beadsMoved = JSON.stringify(before) !== JSON.stringify(after);
const solved = (() => { try { return JSON.parse(info.progress)?.solved?.[0]?.spot === "menu"; } catch { return false; } })();
const seed = (() => { try { return JSON.parse(info.progress)?.seeds?.["lunch:menu"]; } catch { return null; } })();
const ok = errors.length === 0 && info.scrollW <= info.innerW && !info.markers && beadsMoved && solved && seed === "rebuild" && brokenImages.length === 0 && violations.length === 0;
writeFileSync(`${OUT}/run.json`, JSON.stringify({ at: new Date().toISOString(), ok, shots, errors, violations, brokenImages, everRendered: seen, beadsBefore: before, beadsAfter: after, ...info }, null, 1));
console.log(JSON.stringify({ ok, errors, violations: violations.slice(0, 12), brokenImages, scrollW: info.scrollW, innerW: info.innerW, visibleDevMarkers: info.markers, beadsMoved, solved, seed }));
await browser.close();
process.exit(ok ? 0 : 1);
