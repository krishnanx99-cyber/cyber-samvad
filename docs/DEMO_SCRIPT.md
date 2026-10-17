# 3-minute live-demo script

### 0:00–0:25 Problem
"Temple congestion is not only about how many visitors are present. The challenge is knowing whether a bottleneck will form soon, and whether an intervention improves overall flow or merely moves the queue somewhere else."

### 0:25–0:50 What the product does
"DarshanFlow is a prototype digital twin based on synthetic counts and a transparent queue-flow model. It shows crowd conditions in multiple zones and forecasts likely pressure over the next 10 minutes."

### 0:50–1:35 Main demonstration
Open 'Arrival surge'. Show the zone occupancy map. Set arrival rate high. Advance three minutes, or Play; point at primary queue rising and the predicted threshold warning. Show future graph.

### 1:35–2:15 What-if and response
Select 'Activate staffed lane'. Show alternative graph and output comparison. Explain staff and downstream corridor assumptions. Then select 'Meter admissions' and point out that the outside queue grows: our prototype shows tradeoffs rather than magically hiding the crowd. Apply one selected simulated action; show audit log.

### 2:15–2:40 Technical depth
"Every minute, arrivals enter an outside backlog, admissions are bounded by entry capacity, people move through queues subject to service rates and capacity, and completed visits exit. We forecast by replaying this same state transition under alternative actions. No AI black box and no made-up confidence percentages."

### 2:40–3:00 Impact and responsible design
"The concept could help operators identify a bottleneck earlier and compare interventions. We use no biometric identification. It is synthetic and uncalibrated: real deployment requires verified sensors, real site geometry, on-site staff judgement, route safety, and validation."

## Judge Q&A

**Is this AI?** It is deterministic predictive simulation/decision support today, not trained ML; we deliberately prioritized explainability and reliability in six hours. Historical crowd patterns could later inform arrivals forecasting.

**Does it guarantee safety?** No. It is not a safety-certified routing system. It shows risk indicators and tradeoffs, with staff-approved decisions required.

**How accurate is it?** No measured accuracy is claimed because there is no real operational dataset. We validate conservation, capacity limits, deterministic output and scenario consistency. Production requires comparison with real counts.

**What is innovative?** Moving from a static heatmap to interactive 10-minute forecasts, a like-for-like intervention comparison and honest modelling of external queue displacement.

**What if the internet fails?** App and simulation run locally after npm install. Avoid relying on hosted backends. The remote Google Fonts import has system-font fallback.

## Backup plan

1. Save one screenshot of normal, one screenshot of surge, and one screenshot of intervention comparison.
2. Record short 40-second screen capture locally after demo works.
3. Keep a built local production version with `npm run build && npm run preview` and a development version ready.
