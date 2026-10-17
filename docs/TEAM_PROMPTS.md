# Individual Codex prompts — copy one to each developer

## Common rules for every developer

You are enhancing an EXISTING runnable React + Vite + TypeScript project called DarshanFlow. Read README.md, src/types.ts and your owned files first. Use only installed packages unless team lead approves dependency changes. Keep strict TS type safety. DO NOT rewrite App.tsx or alter shared contracts without approval. Build an actual end-to-end improvement, not placeholder cards. Commit only your owned files to your own branch and run `npm run build`. Data is synthetic; no CCTV, face recognition, real routing or unvalidated safety claims. The hackathon remaining time is 5 hours, so prioritise working integration.

---

## DEV A — Simulation and scenario engine

OWN ONLY: `src/engine/simulator.ts`, `src/data/scenarios.ts`.

TASK: Make the synthetic crowd simulation deterministic, realistic enough to explain, and safe against numerical bugs. Preserve `stepSimulation(state,intervention): SimulationState`, `createInitialState(scenario): SimulationState`, and `snapshotOf` signatures. Ensure people are never created or lost internally: outside arrivals + original counts = current counts + completed visitors (account for the modeled exit). Clamp queue and zone occupancy to [0,capacity]. Make three repeatable scenario presets: normal, arrival surge, festival peak. Support metered entry by keeping excess arrivals in an outside backlog. Support extra staffed processing without exceeding downstream capacity. Work in whole minute steps and explain assumptions in comments. Add optional development-only invariant checks in your owned module. Test manual 10–20 ticks; don't edit shared types.

DELIVER: working simulation with deterministic, testable state transitions. Demo proof: normal vs festival diverge; staffing changes throughput; metering doesn't erase waiting people.

---

## DEV B — Visual experience, map and forecast chart

OWN ONLY: `src/components/TempleMap.tsx`, `src/components/ForecastChart.tsx`, `src/styles.css`.

TASK: Build a premium dark command-centre interface without adding dependencies. Use responsive layouts and a modern visual hierarchy. Make the schematic map clickable for all four zones and visually encode occupancy thresholds: normal (<75%), elevated (75–89%), high (>=90%). Show selected-zone occupancy and clear legend; use SVG. Build a forecast chart with baseline vs intervention series and a 90% threshold. Do not claim the map is actual temple architecture. Preserve component props and TypeScript signatures. Avoid huge gradients, meaningless icons, inaccessible text, excessive animations, and hardcoded fake counters. Make desktop demo look excellent, mobile not broken.

DELIVER: refined accessible map and chart, consistent typography, instant interaction, zero compilation errors.

---

## DEV C — Forecast + explainable decisions

OWN ONLY: `src/engine/forecast.ts`.

TASK: Produce useful 10-minute deterministic congestion forecasts based on the simulator. Preserve `forecast(state,intervention,horizon): Forecast` and `compareInterventions(state,horizon): Comparison`. Forecast must replay stepSimulation rather than use arbitrary random outputs. Compare baseline, metered entry and staffed lane, each from IDENTICAL starting state. Compute peak zone utilisation, earliest >=90% threshold, final outside backlog, completed visitor count, estimated main-queue wait, and a transparent, reproducible score. Explicitly penalise outside backlog (metering is not magically safe). Present recommendation as a *simulated candidate for human approval*, NEVER an automatic safe route. Do not claim trained ML or causal validity. Handle start-at-threshold, no breach and zero arrivals gracefully. Document formula assumptions in comments. No new dependencies; no shared type edits.

DELIVER: real forecast comparison where slider/scenario variations produce different predictions and tradeoffs.

---

## DEV D — Integration, demo and judge pitch

OWN ONLY: `src/App.tsx`, `docs/DEMO_SCRIPT.md`, `README.md` (coordinate changes); responsible for PR merges and smoke tests.

TASK: Wire already-defined modules into a complete 3-minute live demo. App must show zone map, scenario selector, arrival slider, current occupancy, +1-minute tick, play/pause, forecast chart, what-if intervention options, Apply simulated action, visible outside backlog and audit log. Ensure comparing options does not mutate live state; Apply should change future transitions and create one audit entry. Maintain human-in-the-loop and synthetic-data disclaimer. Test normal, surge, festival, apply staffing, apply metering, reset; check responsive layout. Keep UI understandable within 15 seconds of viewing. Work with teammates via PRs. Final responsibility: stable green `npm run build`, screenshots, polished 3-minute pitch and backup video/screenshots.

DELIVER: working demo and confident judge explanation including limitations.
