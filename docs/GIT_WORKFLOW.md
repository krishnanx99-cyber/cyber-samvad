# GitHub workflow (5-hour hackathon)

## First 10 minutes: lead only

1. Create empty private GitHub repository `darshanflow-2026` (do not auto-generate README).
2. Extract starter kit and run:

```bash
npm install
npm run build
git init
git add .
git commit -m "chore: seed shared DarshanFlow starter"
git branch -M main
git remote add origin https://github.com/YOUR-ORG/darshanflow-2026.git
git push -u origin main
```

3. Add teammates as repository collaborators in GitHub Settings > Collaborators.
4. Tell teammates to clone; all must start from the same `main` commit.

## Everyone runs (with unique branch name)

```bash
git clone https://github.com/YOUR-ORG/darshanflow-2026.git
cd darshanflow-2026
npm install
git switch -c feat/simulation        # dev A
# or feat/visuals                  # dev B
# or feat/intelligence             # dev C
# or feat/integration              # dev D
```

Make changes only in assigned files; do not modify the shared interface without consensus.

```bash
npm run build
git add src/engine/simulator.ts src/data/scenarios.ts # choose YOUR files only
git commit -m "feat: improve crowd simulation"
git push -u origin feat/simulation
```

Open a Pull Request from your branch to `main`. Integration owner reviews and merges; **one merge at a time**, in order A -> C -> B -> D if dependencies require it. If the starter already runs, branches can be merged in any order that keeps the build green.

## Integration owner after each PR

```bash
git switch main
git pull --ff-only origin main
npm run build
npm run dev
```

Do a 30-second smoke test. Merge next PR only if build and main demo work.

## If a PR conflicts

Developer on the conflicting branch runs:

```bash
git switch feat/your-branch
git fetch origin
git merge origin/main
# resolve conflicts ONLY in your owned files; coordinate for App.tsx/types.ts
npm run build
git add .
git commit -m "fix: resolve integration conflict"
git push
```

Don't force-push `main`, don't let multiple devs change `App.tsx`, and don't commit `node_modules` or `dist`.

## Timestamps relative to start

- T+20 min: agreed contract; everyone developing
- T+60 min: everyone pushes a functional incremental commit
- T+120 min: PRs open and core features ready
- T+150–180 min: first integrated green build
- T+180 min: feature freeze; only fixes and presentation thereafter

## Emergency fallback

If GitHub access fails, integrate by copying the **owned source files** from teammates into the exact corresponding folders in one working directory, then `npm run build`. Do not import whole separate React apps.
