import { stripVTControlCharacters } from 'node:util'

import { expect } from 'chai'

import { makeTestHarness } from '../utils.js'

describe('Programmatic', () => {
  it('works when used via node:test run() function', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/first.feature',
      `Feature:
  Scenario:
    Given a step
    `
    )
    await harness.writeFile(
      'features/steps.js',
      `import { Given } from '@cucumber/node'
Given('a step', (t) => {
  t.assert.strictEqual(2, 2)
})
    `
    )
    await harness.writeFile(
      'run.js',
      `import { run } from 'node:test'
import { spec } from 'node:test/reporters'

run({
  execArgv: [
    '--enable-source-maps',
    '--import',
    '@cucumber/node/bootstrap'
  ],  
  globPatterns: ['features/**/*.feature'],
})
  .compose(spec)
  .pipe(process.stdout)
`
    )
    const [output] = await harness.execFile('./run.js')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ pass 2')
  })
})
