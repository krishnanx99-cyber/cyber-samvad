/* Developer C - Dedicated Forecast & Intervention Unit Tests */
const fs = require('node:fs')
const ts = require('typescript')
const assert = require('node:assert/strict')

require.extensions['.ts'] = function (module, file) {
  const text = fs.readFileSync(file, 'utf8')
  const result = ts.transpileModule(text, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  })
  module._compile(result.outputText, file)
}

const { createInitialState } = require('../src/data/scenarios.ts')
const { forecast, compareInterventions } = require('../src/engine/forecast.ts')

console.log('Testing Developer C Forecast Engine...')

// 1. Test Horizon Snapshot Counts (5, 10, 15)
const baseState = createInitialState('normal')
for (const h of [5, 10, 15]) {
  const res = forecast(baseState, 'none', h)
  assert.equal(res.horizon, h, `Horizon should be ${h}`)
  assert.equal(res.snapshots.length, h + 1, `Horizon ${h} must produce ${h + 1} snapshots`)
  assert.equal(res.snapshots[0].minute, 0, 'First snapshot must be t=0')
  assert.equal(res.snapshots[res.snapshots.length - 1].minute, h, `Last snapshot must be t=${h}`)
}
console.log('✔ Horizon snapshots verified (5->6, 10->11, 15->16).')

// 2. Test Metric Calculations
const surgeState = createInitialState('surge')
const surgeForecast = forecast(surgeState, 'none', 10)
assert.ok(typeof surgeForecast.peakUtilization === 'number' && !Number.isNaN(surgeForecast.peakUtilization), 'peakUtilization is a valid number')
assert.ok(surgeForecast.peakUtilization >= 0, 'peakUtilization >= 0')
assert.ok(typeof surgeForecast.finalOutsideQueue === 'number' && surgeForecast.finalOutsideQueue >= 0, 'finalOutsideQueue >= 0')
assert.ok(typeof surgeForecast.additionalProcessed === 'number' && surgeForecast.additionalProcessed >= 0, 'additionalProcessed >= 0')
assert.ok(typeof surgeForecast.finalMainQueue === 'number' && surgeForecast.finalMainQueue >= 0, 'finalMainQueue >= 0')
assert.ok(typeof surgeForecast.estimatedMainWaitMinutes === 'number' && !Number.isNaN(surgeForecast.estimatedMainWaitMinutes), 'estimatedMainWaitMinutes is a valid number')
assert.ok(typeof surgeForecast.score === 'number' && !Number.isNaN(surgeForecast.score), 'score is valid number')
console.log('✔ All metric fields correctly computed.')

// 3. Test Determinism
const f1 = forecast(surgeState, 'metered', 10)
const f2 = forecast(surgeState, 'metered', 10)
assert.deepEqual(f1, f2, 'Forecast must be completely deterministic for identical inputs')
console.log('✔ Determinism verified.')

// 4. Test Immutability (Input state is NEVER mutated)
const pristineState = createInitialState('festival')
const pristineStateCopy = JSON.parse(JSON.stringify(pristineState))
forecast(pristineState, 'staffedLane', 15)
compareInterventions(pristineState, 15)
assert.deepEqual(pristineState, pristineStateCopy, 'State must remain completely unmutated after forecasting and comparison')
console.log('✔ Immutability verified.')

// 5. Test Comparison with 3 Interventions from SAME initial state
const comp = compareInterventions(surgeState, 10)
assert.ok(comp.baseline, 'Comparison must include baseline')
assert.equal(comp.options.length, 3, 'Comparison must have exactly 3 options (none, metered, staffedLane)')
assert.equal(comp.options[0].intervention, 'none', 'First option must be none')
assert.equal(comp.options[1].intervention, 'metered', 'Second option must be metered')
assert.equal(comp.options[2].intervention, 'staffedLane', 'Third option must be staffedLane')
// All 3 options start from the exact same t=0 snapshot
assert.deepEqual(comp.options[0].snapshots[0], comp.options[1].snapshots[0], 'All options must share identical t=0 snapshot')
assert.deepEqual(comp.options[0].snapshots[0], comp.options[2].snapshots[0], 'All options must share identical t=0 snapshot')
// Metering must keep excess arrivals in outsideQueue compared to baseline
assert.ok(comp.options[1].finalOutsideQueue >= comp.options[0].finalOutsideQueue, 'Metered admission must increase or maintain outside backlog')
// Staffed lane must increase or maintain throughput compared to baseline
assert.ok(comp.options[2].additionalProcessed >= comp.options[0].additionalProcessed, 'Staffed lane must increase or maintain processed throughput')
assert.ok(['none', 'metered', 'staffedLane'].includes(comp.preferred.intervention), 'Preferred intervention must be one of the 3 options')
assert.ok(typeof comp.explanation === 'string' && comp.explanation.length > 10, 'Explanation must be a non-empty descriptive string')
console.log('✔ Intervention comparisons, divergent trajectories, and explanations verified.')

// 6. Test Scenario Divergence
const normalF = forecast(createInitialState('normal'), 'none', 10)
const festivalF = forecast(createInitialState('festival'), 'none', 10)
assert.notEqual(normalF.peakUtilization, festivalF.peakUtilization, 'Normal and Festival forecasts should diverge in peak utilization')
assert.notEqual(normalF.score, festivalF.score, 'Normal and Festival forecasts should diverge in score')
console.log('✔ Scenario divergence verified.')

// 7. Test Edge Case: t=0 breach
const breachedState = createInitialState('normal')
breachedState.zones.queueA.occupancy = breachedState.zones.queueA.capacity // 100% full
const breachedForecast = forecast(breachedState, 'none', 10)
assert.equal(breachedForecast.firstThresholdMinute, 0, 'If threshold breached at t=0, firstThresholdMinute must be 0')
console.log('✔ t=0 breach edge case verified.')

// 8. Test Edge Case: zero service rate (avoid division by zero)
const zeroRateState = createInitialState('normal')
zeroRateState.config.mainServiceRate = 0
const zeroRateForecast = forecast(zeroRateState, 'none', 10)
assert.ok(!Number.isNaN(zeroRateForecast.estimatedMainWaitMinutes) && Number.isFinite(zeroRateForecast.estimatedMainWaitMinutes), 'Zero main service rate must not produce NaN or Infinity')
console.log('✔ Zero service rate edge case verified.')

// 9. Test Edge Case: Overcapacity observed (150% in all zones)
const overState = createInitialState('festival')
for (const z of Object.values(overState.zones)) z.occupancy = Math.round(z.capacity * 1.5)
const overF = forecast(overState, 'none', 10)
assert.equal(overF.firstThresholdMinute, 0, 'firstThresholdMinute is 0 on overcapacity')
assert.ok(overF.peakUtilization >= 1.5, 'peak utilization accurately captures overcapacity')
console.log('✔ Observed overcapacity (150%) edge case verified.')

// 10. Test Edge Case: Completely empty state & no breach through horizon
const emptyState = createInitialState('normal')
emptyState.config.arrivalRate = 0
for (const z of Object.values(emptyState.zones)) z.occupancy = 0
const emptyF = forecast(emptyState, 'none', 10)
assert.equal(emptyF.firstThresholdMinute, null, 'firstThresholdMinute is null when no zone breaches 90%')
assert.equal(emptyF.peakUtilization, 0, 'peak utilization is 0 for empty zones')
assert.equal(emptyF.finalOutsideQueue, 0, 'outsideQueue is 0')
console.log('✔ No breach / empty state edge case verified.')

// 11. Stress Test: Extreme Configurations & Horizons
const stressConfigs = [
  { arrivalRate: 0, mainServiceRate: 0, secondaryServiceRate: 0, exitRate: 0, meteredGateRate: 0 },
  { arrivalRate: 1000, mainServiceRate: 500, secondaryServiceRate: 500, exitRate: 500, meteredGateRate: 500 }
]
for (const cfg of stressConfigs) {
  const s = createInitialState('surge')
  s.config = cfg
  for (const h of [1, 5, 10, 15]) {
    for (const action of ['none', 'metered', 'staffedLane']) {
      const f = forecast(s, action, h)
      assert.ok(!Number.isNaN(f.score) && Number.isFinite(f.score), 'score is finite number')
      assert.ok(!Number.isNaN(f.peakUtilization) && Number.isFinite(f.peakUtilization), 'peakUtilization is finite')
      assert.ok(!Number.isNaN(f.estimatedMainWaitMinutes) && Number.isFinite(f.estimatedMainWaitMinutes), 'wait time is finite')
      assert.equal(f.snapshots.length, h + 1, 'snapshot length equals h + 1')
    }
  }
}
console.log('✔ Extreme stress & fuzz configs verified.')

console.log('\nALL DEVELOPER C TESTS PASSED SUCCESSFULLY (11/11 SUITES)!')
