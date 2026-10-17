# DARSHANFLOW — START HERE NOW (5-hour hackathon)

**Goal:** One temple per session/account context. Upload one floor-plan image, align FOUR configured demo zones, read synthetic crossing events or staff-provided counts, forecast 5/10/15 minutes, compare human-approved interventions. **No multi-tenancy/auth needed during hackathon.**

## First 12 minutes — team lead
1. Unzip and run `npm install`, `npm run dev`, `npm run test:engine`, `npm run test:observations`.
2. Create GitHub repo `darshanflow-hackathon`; commit starter; push `main`.
3. Send repo link + `docs/CODEX_MASTER_PROMPT.md` + **only assigned part** from `docs/PARALLEL_TASKS.md` to teammates.
4. Create branches `feat/observations`, `feat/map-ui`, `feat/prediction`, `feat/integration`; NEVER have two workers editing `App.tsx` or `src/types.ts`.
5. Use module functions exported in existing starter: `stepSimulation`, `forecast`, `compareInterventions`, `TempleMap`. New `applyObservation` lives in `src/engine/observations.ts`.

## 5-hour clock, started when you begin
- 00:00–00:12 — running starter, branch ownership and smoke test.
- 00:12–01:45 — code independently with short commits.
- 01:45–02:25 — integrate **first** observation mode + map + forecasts. Stop new foundational refactors.
- 02:25–03:10 — complete 3-minute judge demo; handle bugs and full-flow test.
- 03:10–04:00 — polish UI, build, screenshot and pitch.
- 04:00–04:35 — real rehearsal and backup demo.
- 04:35–05:00 — submission buffer. **Timebox all nice-to-haves.**

## Must-have full demo
1. Start in **SIMULATION** mode; no real people counts claimed.
2. Show four-zone schematic or upload a temple floor-plan background; operator labels/positions the zones, not AI.
3. Show `Synthetic gate` and `Staff correction` inputs, with event logs and source/timestamps.
4. Trigger festival surge or crossing counts. Occupancy should change from data, not just a hardcoded visual animation.
5. Set 5/10/15 forecast and see time to threshold.
6. Compare baseline against metered entry and activated staffed overflow lane, showing **external backlog** and throughput tradeoffs.
7. Show a suggested action for staff approval; never automatically reroute visitors.

## Hard scope exclusions
- No real account system/auth, no multiple temples in an admin dashboard.
- No CCTV integration, face detection, attendance identification or claimed live crowd measurement.
- No new ML training, cloud service, QR integration, payment, parking, weather, chatbots, Kubernetes.
- No automatic floor-plan recognition, unrestricted arbitrary zone graph or 'safe route' claims.

## Strong demo honesty
**This is a configurable simulation-based planning prototype.** Actual real-time deployment requires calibrated entry/exit counting sensors, accurate zone boundaries, verified route capacities, event latency handling and staff approval.
