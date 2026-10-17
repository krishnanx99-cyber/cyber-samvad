# Source review for external GitHub repositories — 17 Oct 2026

## Repository 1: DevYatra
https://github.com/manjunath5513/DevYatra
README describes temple crowd management with YOLO people counting, Python/Flask backend, Next.js frontend, AI forecasting and many ancillary features. Named folder paths: `CrowdAnalyser/YOLOv8`, `aiml crowd prediction`, `sih2025-qbit`, `backend`.

**Relevant design ideas:** directional crowd counting / source of counts, system separation between ingestion/analytics/operator dashboard, temple-specific accessibility.
**Not recommended for our sprint:** full Next.js frontend, Flask backend, YOLO inference and external API integrations. Those require validation and substantial setup. README feature claims have not been independently executed.

## Repository 2: AI-Driven Queue Management Digital Twin
https://github.com/hareeshanellakara-git/AI-Driven-Queue-Management-Digital-Twin
README describes synthetic Python queue simulation, Streamlit dashboard, QR check-in, RandomForestRegressor wait-time model, scenario comparisons. Named folders: `simulation`, `ai_models`, `dashboard`.

**Relevant design ideas:** arrival/service queue math, wait-time estimates, comparing interventions from identical snapshots, time-to-overload.
**Not recommended for our sprint:** Python ML model or Streamlit app integration into Vite; model trained on simulated records does not establish real-world validity for temples. We already have a deterministic TypeScript queue model.

## Reuse and licensing
Both repositories are public; no LICENSE file was visible in their top-level GitHub browser listing when reviewed. This is NOT confirmation that copyright reuse is permitted. **Study concepts; write our own source.** If later copying files, check the exact applicable license(s), authorship and hackathon rules first and maintain attribution where required.

## Verification limitation
Reviewed GitHub project pages and README descriptions; nested source code could not be fetched consistently from the web environment and neither repository was installed or executed here. Therefore no performance or operational capability claims are verified.
