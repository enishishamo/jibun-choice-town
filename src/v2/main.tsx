// Ver.2 entry (loaded only by /v2.html). Must never import from src/screens,
// src/q1, src/state, src/App.tsx or src/index.css — Ver.1 stays frozen and
// untouched (enforced by factory/harness/ver1-freeze-check.mjs).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import V2App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <V2App />
  </StrictMode>,
);
