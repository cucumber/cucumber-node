import { makeTestHarness } from '../utils.js'
import { expect } from 'chai'
import { stripVTControlCharacters } from 'node:util'

describe('progress reporter', () => {
  it('reports the run accurately', async () => {
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

    const [output] = await harness.run('@cucumber/node/reporters/progress')
    const sanitised =  stripVTControlCharacters(output.trim())

    expect(sanitised).to.eq(`....F

2 scenarios (1 passed)
5 steps (4 passed)`)
  })
})