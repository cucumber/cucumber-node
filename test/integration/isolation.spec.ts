import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'

describe('Isolation', () => {
  let isolationOption = '--test-isolation'
  if (Number(process.versions.node.split('.')[0]) < 24) {
    isolationOption = '--experimental-test-isolation'
  }

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
    const [output] = await harness.run('spec', `${isolationOption}=none`)
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ tests 6')
    expect(sanitised).to.include('ℹ suites 2')
    expect(sanitised).to.include('ℹ pass 6')
  })
})
