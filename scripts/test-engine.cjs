/* Minimal deterministic tests; run after `npm install` with `npm run test:engine`. */
const fs = require('node:fs')
const ts = require('typescript')
const assert = require('node:assert/strict')
require.extensions['.ts'] = function (module, file) {
  const text = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  module._compile(result.outputText, file)
}
const { createInitialState } = require('../src/data/scenarios.ts')
const { stepSimulation } = require('../src/engine/simulator.ts')
const { compareInterventions, forecast } = require('../src/engine/forecast.ts')
let cases = 0
for (const scenario of ['normal','surge','festival']) {
  for (const action of ['none', 'metered','staffedLane']) {
    let state = createInitialState(scenario)
    for(let tick=0;tick<100;tick++) {
      const previousTotal = Object.values(state.zones).reduce((s,z)=>s+z.occupancy,0)+state.outsideQueue+state.processed
      const next = stepSimulation(state, action)
      assert.equal(next.minute, tick+1)
      const nextTotal = Object.values(next.zones).reduce((s,z)=>s+z.occupancy,0)+next.outsideQueue+next.processed
      assert.equal(nextTotal, previousTotal+state.config.arrivalRate, `conservation fail ${scenario} ${action} tick ${tick}`)
      assert.ok(next.outsideQueue >= 0)
      for (const zone of Object.values(next.zones)) assert.ok(zone.occupancy >= 0 && zone.occupancy <= zone.capacity, `capacity ${zone.id}`)
      state=next;cases++
    }
  }
  const original = createInitialState(scenario)
  const first = forecast(original, 'none', 10)
  const second = forecast(original, 'none', 10)
  assert.deepEqual(first,second, 'determinism')
  assert.equal(first.snapshots.length, 11)
  assert.equal(original.minute,0,'forecast mutation')
  assert.equal(compareInterventions(original,10).options.length,3)
}
console.log(`OK: ${cases} ticks conserved, capacities held, forecasts deterministic.`)
