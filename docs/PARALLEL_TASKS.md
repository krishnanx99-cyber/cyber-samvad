# FOUR PARALLEL CODEX ASSIGNMENTS — COPY ONLY YOUR PART

## Shared startup (everyone)
1. Pull `main`, create own `feat/...` branch, paste the shared `docs/CODEX_MASTER_PROMPT.md` plus YOUR part below into Codex.
2. `npm install` once locally; run `npm run dev`; understand existing code before changing it.
3. Commit at a meaningful point and push for integration. No force pushes and no big refactors.
4. Tell developer D your module's props/functions. Do not edit D's `App.tsx`.

---

## DEVELOPER A — COUNTS + SIMULATION (branch feat/observations)
**Own:** `src/engine/observations.ts`, `src/engine/simulator.ts`, `src/data/scenarios.ts`, `scripts/test-observations.cjs`, and your tests. **Do not edit:** `App.tsx`, `TempleMap.tsx`, CSS, shared types.

Implement/test:
1. Review starter's `applyObservation(state,event)`; synthetic gate crossings and staff corrections already exist. Harden it: reject invalid counts and unsupported boundaries; prevent duplicated event IDs via helper (or tell D to maintain accepted-ID Set in App); source and reason auditability. Ensure each event has an ISO timestamp and source label.
2. In observation mode count from each configured gate/zone crossing, NOT multiple measurements of the same visitors. Crossing external->entry adds people. Crossing queueA->darshan transfers exactly; darshan->external records completed people. Staff correction updates known occupancy with reason and logs signed discrepancy. Support measurements >capacity without hiding overload; preserve immutability.
3. Keep deterministic simulation with arrival surge, normal and festival; people conservation for simulator; no negatives. Forecasts must receive a single source-of-truth snapshot.
4. Provide clear `applyObservation` usage to D and unit tests for impossible paths, source exceeded, overcapacity and staff corrections. Do not invent real CCTV data.

**Definition of done:** two synthetic gate events update displayed zone counts, correction recalibrates count, and simulation conservation test still passes.

---

## DEVELOPER B — TEMPLE MAP + VISUAL UI (branch feat/map-ui)
**Own:** `src/components/TempleMap.tsx`, NEW `src/components/TempleSetup.tsx`, `src/styles.css`, optional UI-only `src/components/ForecastChart.tsx`. **Do not edit:** `App.tsx`, prediction/simulator modules or shared types.

Build:
1. Premium visually legible dark operations dashboard styling; high contrast, large data, clear legends, responsive desktop/mobile.
2. Create an optional `TempleSetup` React component: PNG/JPG upload (file local only, no servers), preview background image; configurable display name for ONE temple; overlay four pre-existing zone IDs as movable rectangles or draggable markers on image; edit zone labels and *configured* capacity via callbacks; save/load JSON or browser-local settings. Use percentages for overlay positions so resizing works.
3. Keep fallback beautiful default schematic map if user has not uploaded an image. Existing `TempleMap` prop contract MUST keep working, or add optional config props with backward compatibility.
4. Show selected-zone occupancy, >=75% amber and >=90% red relative to configured capacity. Distinguish simulated vs staff-observed data visually (source badge supplied by D).
5. Avoid full AI floor-plan interpretation, arbitrary unlimited zones, real map navigation, and unsupported automatic crowd-density claims.

**Definition of done:** upload sample image -> align four zones -> click a zone -> see the mapped label/occupancy/capacity; default schematic still works. Export minimal integration prop/type instructions for D.

**Fallback at 45 min if drag/drop hurts:** simple four marker positions (x/y sliders) over image. No polygon editor.

---

## DEVELOPER C — PREDICTION + COMPARISON (branch feat/prediction)
**Own:** `src/engine/forecast.ts`, NEW `scripts/test-forecast.cjs` (and optional isolated test support). **Do not edit:** `App.tsx`, visuals, types (unless leader approves).

Implement/test:
1. Preserve public API `forecast(state, intervention, horizon): Forecast` and `compareInterventions(state,horizon): Comparison`.
2. Support horizons 5,10,15 (already configurable in API); calculate all zone occupancy, peak utilisation, earliest >=90% threshold, main queue expected wait, total completed throughput and waiting outside.
3. Compare `none`, `metered`, `staffedLane` from SAME input state, without changing it. Reuse simulator tick. Simple arrival/service rates are DEMO assumptions, not trained ML. No external Python model needed.
4. Important caveat: forecast in staff-observed mode is scenario-based using most recently configured arrival/service assumptions, NOT validated live prediction. Display forecast assumptions for D.
5. Correct edge cases: overflow observed, zero arrivals, zero service rate, threshold already breached at t=0, no breach through chosen horizon.
6. Expose meaningful first-threshold and trade-off description, show if metering causes an outside queue, and avoid always 'recommending' diversion regardless of capacity.

**Definition of done:** 5/10/15 forecasts produce 6/11/16 snapshots; scenario changes update prediction; unit tests pass; comparison never mutates live state.

---

## DEVELOPER D — INTEGRATION + DEMO + GITHUB (branch feat/integration)
**Own:** `src/App.tsx`, `docs/DEMO_SCRIPT.md`, README, merge responsibility, testing and presentation. **Do not edit:** teammate-owned files until review/merge.

Build/integrate:
1. Add simple `Simulation / Observations` switch. When Observations active, ALWAYS pause timer and do not call `stepSimulation`; send synthetic gate crossings via `applyObservation`; allow staff correction count with numeric input and reason. Track handled observation IDs in a Set/ref and reject duplicates. Display event source and last update. Avoid calling the same data stream twice.
2. Add 5/10/15 horizon segmented controls and recalculate comparison from current snapshot; label time-to-threshold, selected intervention and outside backlog. Keep all current functionality.
3. Integrate `TempleSetup` from B (one temple, no multi-account UI), use default schematic if map missing.
4. Integrate new A/C APIs, correct any compile errors and preserve simulated-data/disclaimer. Test normal, surge, festival, correction >capacity, metering, staffed lane, resets and toggles.
5. Manage all merges in GitHub; resolve file conflicts only after understanding changes. Run `npm run test:engine && npm run test:observations && npm run build`.
6. Create 3-minute walkthrough: a map upload/config demo (20s), synthetic gate counter (20s), staff correction (20s), festival surge/forecast (50s), baseline vs intervention (45s), responsible design + limitations (25s).
7. Capture screenshot and backup screen recording if possible. Avoid invalid claims of accurate prediction or certified crowd safety.

**Definition of done:** judge interacts with an entire demo without needing internet or backend, and teammate explanations are ready.

---

## Integration contract (freeze now)
```ts
// Already in src/types.ts:
// ZoneId: 'entry'|'queueA'|'queueB'|'darshan'
// stepSimulation(state,intervention): SimulationState
// forecast(state,intervention,horizon): Forecast
// compareInterventions(state,horizon): Comparison
// createInitialState(scenario): SimulationState

// Already in src/engine/observations.ts:
applyObservation(state: SimulationState, event: Observation): ObservationResult
// accepted => use result.next; rejected => show result.message, keep existing state
// observation ids must be deduped in App/integrator state

// Developer B must keep original TempleMap(props) working and provide:
// TempleSetup({config,onChange}) with locally defined config interface
// config: templeName, optional imageDataUrl, zone overlay positions 0-100%,
// zone display names, configured capacities. Existing fixed IDs remain intact.
```

**If team only has 3 people:** A owns counts; B owns map; C owns forecast; leader handles D tasks and pauses feature development at integration time.
