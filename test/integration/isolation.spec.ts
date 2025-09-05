import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'

describe('Isolation', () => {
  it('runs as expected with --test-isolation=none', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/first.feature',
      `Feature:
Scenario:
  Given a step
  And another step
  `
    )
    await harness.writeFile(
      'features/second.feature',
      `Feature:
Scenario:
  Given a step
  And another step
  `
    )
    await harness.writeFile(
      'features/steps.js',
      `import { Given } from '@cucumber/node'
Given('a step', () => {})
Given('another step', () => {})
  `
    )
    const [output] = await harness.run('spec', '--test-isolation=none')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ pass 8')
  })
})
