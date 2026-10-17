# MASTER CODEX INSTRUCTION — DARSHANFLOW

You are an experienced hackathon engineering agent. Upgrade the EXISTING `darshanflow-starter` React 19 + Vite + TypeScript application. Read `README.md`, `docs/START_HERE_NOW.md`, `src/types.ts`, `src/engine/simulator.ts`, `src/engine/forecast.ts`, `src/engine/observations.ts`, and assigned part of `docs/PARALLEL_TASKS.md` BEFORE editing. Follow module ownership. Do not recreate the project or swap technology stacks.

## Product
**DarshanFlow: Predictive Crowd Digital Twin and Operator Decision Support for ONE temple.**
The organiser selects a sample temple or uploads a PNG/JPG floor-plan, manually locates 4 logical zones (`entry`,`queueA`,`queueB`,`darshan`) and configures capacities. No automatic architectural understanding. One current temple configuration only; optional localStorage persistence, NO signup or multi-tenant management.

## Data integrity
Never imply synthetic data is a live sensor reading. Current occupancy must come from explicit synthetic simulator ticks or verified/demo observation events, NOT random independent UI counters. Provide a `Simulation | Observations` mode switch (owner D). **Never apply stepSimulation and observation crossing events to the SAME simulated minute**: they would double-count arrivals. In observations mode, pause the continuous simulator. `src/engine/observations.ts` already supplies `applyObservation(state,event)` accepting source-labeled crossings and staff corrections. Add event-ID dedup in integration layer. Staff correction is a recalibration, NOT a visitor transfer; log discrepancy, time and reason. If counted occupancy exceeds configured capacity, display the overload rather than silently clamping it.

## Forecasting and decision logic
Deterministic minute-by-minute projection for 5, 10, 15 minutes via `stepSimulation` replay. Use state occupancy, arrival rate, service rates and downstream limits. Return earliest threshold crossing, zone occupancy series, entry backlog, completed visitors, estimated main-queue waiting time. Compare from the IDENTICAL snapshot for baseline, metered entry and trained-staff lane intervention. Outside wait must remain visible; metered admission moves people outside and does NOT automatically improve total visitor experience. Present the interventions as human-reviewed candidate scenarios. No automatic safety decisions or routes.

## UI expectation
Create a visually compelling dark operations console with rich spatial map and changing occupancy, selected-zone detail, 5/10/15 forecast toggle, timeline and scenario comparison. Put `SIMULATED INPUT` labels and staff correction timestamps close to the counts. Make the main demo readable within 10 seconds. Avoid overloading UI with irrelevant features.

## Testing acceptance
- `npm run test:engine`, `npm run test:observations`, `npm run build` pass after npm install.
- State does not mutate during forecasts; 5, 10, 15 steps yield correct lengths.
- Full observation transfer decreases source and increases destination; external entrants do not magically appear elsewhere; staff count correction visibly changes observation and baseline.
- Reject duplicate crossing IDs in UI ingestion; reject impossible boundaries. No negative occupancy.
- Show overload if correction > configured capacity; never clamp observation silently.
- Snapshot comparison from identical starting point; model simulation assumptions visible.
- Sample demo runs without API keys or external services.

## Engineering rules
Use pure TypeScript functions and existing interfaces where possible; minimal dependencies, accessible UI. Work on assigned branch and files only. Do not silently edit `src/types.ts` shared contract without leader agreement. Commit finished increment and provide the integrator (a) changed filenames, (b) function signatures and usage, (c) tests run, (d) integration details. Avoid unfinished placeholders, external ML models or unverified claims of accuracy.

## External repositories reviewed
1. https://github.com/hareeshanellakara-git/AI-Driven-Queue-Management-Digital-Twin — simulation, queue stability, wait-time, scenario comparisons, not a runtime dependency.
2. https://github.com/manjunath5513/DevYatra — broad temple modules, YOLO counting references, not a runtime dependency.
Do not copy unlicensed source code. Review any actual license before reuse; refer to concepts only and independently implement. A README claim is not proof that a feature actually works.
