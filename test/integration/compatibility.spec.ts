import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'

describe('Compatibility with cucumber-js', () => {
  it('skips when the user code function returns "skipped"', async () => {
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
      'features/steps.js',
      `import { Given } from '@cucumber/node'
Given('a step', () => {
  return 'skipped'
})
Given('another step', (t) => {
  // no-op
})
  `
    )
    const [output] = await harness.run('spec')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ skipped 2')
  })

  it('marks as todo when the user code function returns "pending"', async () => {
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
      'features/steps.js',
      `import { Given } from '@cucumber/node'
Given('a step', () => {
  return 'pending'
})
Given('another step', (t) => {
  // no-op
})
  `
    )
    const [output] = await harness.run('spec')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ todo 2')
  })
})
