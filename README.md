# DarshanFlow — PS5 Hackathon Starter Kit

**Status:** Working, synthetic-data MVP starter. The team should improve the implementation, test scenarios, and pitch—not rebuild infrastructure.

## Launch in 2 minutes

```bash
npm install
npm run dev
```

Open the local URL reported by Vite (usually http://localhost:5173).

**Before team branches:** One person creates a GitHub repository, extracts this folder at its root, runs `npm install`, commits **package-lock.json**, and pushes `main`. Everyone clones that repo. Do **not** create separate applications or run separate Vite scaffolds.

## Team ownership (all develop in parallel)

| Dev | Owns | API contract |
|---|---|---|
| A Simulation | `src/engine/simulator.ts`, `src/data/scenarios.ts` | `stepSimulation(state, intervention)`, `createInitialState(scenario)` |
| B Frontend visual | `src/components/TempleMap.tsx`, `src/components/ForecastChart.tsx`, `src/styles.css` | `TempleMap({zones,selectedZone,onSelect})`, `ForecastChart({baseline,alternative,capacity})` |
| C Forecast / decisions | `src/engine/forecast.ts` | `forecast(state,intervention,horizon)`, `compareInterventions(state,horizon)` |
| D Integration / demo | `src/App.tsx`, `docs/DEMO_SCRIPT.md`, final build/merge | Hook all team modules together, own tests and pitch |

**DO NOT MODIFY `src/types.ts` independently.** Propose interface changes in your team chat and get lead approval. This is how we avoid integration conflicts.

## Precisely what the simulation means

- Arrival rate is synthetic *people per model minute*.
- Entry, primary queue, optional staffed lane, and darshan corridor have configured capacities.
- A staffed lane adds modeled processing ability **only if authorised staff and the downstream corridor exist**.
- Metering moves demand to an **outside backlog**, which must stay visible; it is not magically removed.
- Forecasts are replayed using the same deterministic simulation tick; no external AI or ML model is claimed.
- Red/orange indicators show thresholds in a toy model. They are **not validated safety conclusions**.
- Waiting-time approximation = primary queue occupancy / primary service rate (not a calibrated real-world estimate).

## MVP freeze: required acceptance criteria

1. Scenario select reset to `normal`, `surge`, or `festival` and render zones.
2. `+1 min` changes simulated occupancy; `Play` runs and `Pause` stops.
3. Forecast displays a 10-minute baseline and selected intervention.
4. For metering, outside backlog is disclosed, never hidden.
5. Staffed lane doesn't create visitors or allow any zone over its configured capacity.
6. Applying a simulated action updates subsequent ticks and adds an audit entry.
7. Changing arrival-rate slider changes forecast.
8. Responsive enough to demo on a laptop; no failed imports or TypeScript errors.
9. `npm run build` succeeds.
10. Pitch includes limitations: synthetic inputs, uncalibrated models, real interventions only by authorised staff.

## Avoid scope creep

No auth, Supabase, Face Recognition, CCTV integration, chatbot, QR ticketing, multilingual voice, machine-learning claims or backend services until the core demonstration is fully working.

## Where to read next

- [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md) — exact merge commands and conflict handling
- [`docs/TEAM_PROMPTS.md`](docs/TEAM_PROMPTS.md) — copy/paste Codex prompts for all four members
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — three-minute judge demo

## Required hackathon boundaries

Student guideline PS5: simulated zone maps, crowd levels, expected waits, capacity-aware advice and organiser alerts; no facial recognition or identifying devotees. It is a simulation, not a live safety system. Present normal and stressed scenarios; discuss privacy and deployment limitations. Judges seek understanding, practical solution, working demo, impact, responsible design and team explanation.
