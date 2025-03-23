import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'

describe('World', () => {
  it('shares state between steps but not between test cases', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/first.feature',
      `Feature:
Scenario:
  Given a step
  And another step
Scenario:
  Given a step
  And another step
  `
    )
    await harness.writeFile(
      'features/steps.js',
      `import { Given } from '@cucumber/node'
Given('a step', (t) => {
  t.assert.strictEqual(t.world.foo, undefined)
  t.world.foo = 'bar'
})
Given('another step', (t) => {
  t.assert.strictEqual(t.world.foo, 'bar')
})
  `
    )
    const [, , exitCode] = await harness.run('spec')
    expect(exitCode).to.eq(0)
  })

  it('uses custom world creator and destroyer', async () => {
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
Given('a step', () => {})
  `
    )
    await harness.writeFile(
      'features/support.js',
      `import { CustomWorld } from '@cucumber/node'
CustomWorld(async () => {
  console.log('Ran custom world creator!')
  return {}
}, async (world) => {
  console.log('Ran custom world destroyer!')
})
  `
    )
    const [output] = await harness.run('spec')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('Ran custom world creator!')
    expect(sanitised).to.include('Ran custom world destroyer!')
  })
})
