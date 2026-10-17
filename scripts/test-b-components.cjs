// Test suite for Developer B components and contracts (TempleSetup, TempleMap, Theme)
const assert = require('assert')
const fs = require('fs')
const path = require('path')

console.log('--- RUNNING DEVELOPER B COMPONENT VERIFICATION ---')

// 1. Verify files exist
const templeSetupPath = path.join(__dirname, '../src/components/TempleSetup.tsx')
const templeMapPath = path.join(__dirname, '../src/components/TempleMap.tsx')
const stylesPath = path.join(__dirname, '../src/styles.css')

assert(fs.existsSync(templeSetupPath), 'TempleSetup.tsx must exist')
assert(fs.existsSync(templeMapPath), 'TempleMap.tsx must exist')
assert(fs.existsSync(stylesPath), 'styles.css must exist')

const setupContent = fs.readFileSync(templeSetupPath, 'utf8')
const mapContent = fs.readFileSync(templeMapPath, 'utf8')
const stylesContent = fs.readFileSync(stylesPath, 'utf8')

// 2. Verify Zone IDs
const requiredZones = ['entry', 'queueA', 'queueB', 'darshan']
for (const id of requiredZones) {
  assert(setupContent.includes(`id: '${id}'`), `TempleSetup must configure zone ID: ${id}`)
  assert(mapContent.includes(`'${id}'`), `TempleMap must handle zone ID: ${id}`)
}

// 3. Verify Theme support
assert(setupContent.includes('darshanflow_theme'), 'TempleSetup must persist theme to localStorage')
assert(setupContent.includes('data-theme'), 'TempleSetup must set data-theme attribute')
assert(stylesContent.includes('[data-theme="light"]'), 'styles.css must provide light theme rules')
assert(stylesContent.includes('--bg-app'), 'styles.css must define semantic CSS custom properties')

// 4. Verify percentage coordinate system (0 - 100%)
assert(setupContent.includes('xPct') && setupContent.includes('yPct'), 'TempleSetup must use percentage positions')
assert(setupContent.includes('wPct') && setupContent.includes('hPct'), 'TempleSetup must use percentage dimensions')
assert(mapContent.includes('xPct') && mapContent.includes('yPct'), 'TempleMap must consume percentage coordinates')

// 5. Verify Thresholds: Normal (<75%), Elevated (75-89%), Critical (>=90%)
assert(mapContent.includes('0.9') || mapContent.includes('0.90'), 'TempleMap must implement >=90% critical threshold')
assert(mapContent.includes('0.75'), 'TempleMap must implement >=75% elevated threshold')
assert(mapContent.includes('CRITICAL'), 'TempleMap must output CRITICAL status')
assert(mapContent.includes('ELEVATED'), 'TempleMap must output ELEVATED status')
assert(mapContent.includes('NORMAL'), 'TempleMap must output NORMAL status')

// 6. Verify Fallback and Backward Compatibility
assert(mapContent.includes('hasCustomImage'), 'TempleMap must branch on custom image availability')
assert(mapContent.includes('SIMULATED COUNTS'), 'TempleMap must include synthetic disclaimer in schematic')
assert(mapContent.includes('custom-map-viewport'), 'TempleMap must support custom floor-plan viewport')

console.log('✅ ALL DEVELOPER B COMPONENT VERIFICATIONS PASSED CLEANLY!')
