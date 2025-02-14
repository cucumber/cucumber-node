import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'

describe('reporters', () => {
  it('does not emit messages as diagnostics if no cucumber reporters', async () => {
    const harness = await makeTestHarness('reporters')
    await harness.writeFile('features/first.feature', `Feature:
  Scenario:
    Given a step that passes
    And a step that passes
    And a step that passes
    
  Scenario:
    Given a step that passes
    And a step that fails
    `)
    await harness.writeFile('features/steps.js', `import { Given } from '@cucumber/node'
  
  Given('a step that passes', () => {})
  
  Given('a step that fails', () => {
    throw new Error('whoops')
  })
    `)
    const [output] = await harness.run('spec')
    const sanitised =  stripVTControlCharacters(output.trim())
    expect(sanitised).not.to.include('@cucumber/messages:')
})
})