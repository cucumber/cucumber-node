import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'

describe('Modules', () => {
  it('handles TypeScript code via type stripping', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/first.feature',
      `Feature:
  Scenario:
    Given a step
    `
    )
    await harness.writeFile(
      'features/steps.ts',
      `import { Given } from '@cucumber/node'
import type { TestCaseContext } from '@cucumber/node'
Given('a step', (t: TestCaseContext) => {
  t.assert.strictEqual(2, 2)
})
    `
    )
    const [output] = await harness.run('spec', '--experimental-strip-types')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ pass 2')
  })
})
