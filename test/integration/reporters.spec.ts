import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'

import { expect } from 'chai'

import { makeTestHarness } from '../utils.js'

describe('Reporters', () => {
  describe('spec', () => {
    it('correctly references pickle location when reporting errors', async () => {
      const harness = await makeTestHarness()
      await harness.writeFile(
        'features/foo.feature',
        `Feature: a feature
  Scenario: a scenario
    Given a passing step
    And a failing step
    `
      )
      await harness.writeFile(
        'features/steps.js',
        `import { Given } from '@cucumber/node'
  Given('a passing step', () => {})
  Given('a failing step', () => {
    throw new Error('whoops')
  })
    `
      )
      const [output] = await harness.run('spec')
      const sanitised = stripVTControlCharacters(output.trim())
      expect(sanitised).to.include(`test at ${path.join('features', 'foo.feature')}:2:3`)
    })

    it('provides a useful error for an ambiguous step', async () => {
      const harness = await makeTestHarness()
      await harness.writeFile(
        'features/first.feature',
        `Feature:
  Scenario:
    Given a step`
      )
      await harness.writeFile(
        'features/steps.js',
        `import { Given } from '@cucumber/node'
Given('a step', () => {})
Given('a step', () => {})`
      )
      const [output] = await harness.run('spec')
      const sanitised = stripVTControlCharacters(output.trim())
      expect(sanitised).to.include(`Multiple matching step definitions found for text "a step":
  1) ${path.join('features', 'steps.js')}:2:1
  2) ${path.join('features', 'steps.js')}:3:1`)
    })

    it('provides a useful error for an undefined step', async () => {
      const harness = await makeTestHarness()
      await harness.writeFile(
        'features/first.feature',
        `Feature:
  Scenario:
    Given a step
    `
      )
      const [output] = await harness.run('spec')
      const sanitised = stripVTControlCharacters(output.trim())
      expect(sanitised).to.include(`
  Error: No matching step definitions found for text "a step"
  
  You can implement the step with this code:
  
  Given('a step', t => {
    t.todo();
  });
`)
    })
  })

  describe('progress', () => {
    it('outputs the progress format', async () => {
      const harness = await makeTestHarness()
      await harness.writeFile(
        'features/first.feature',
        `Feature:
  Scenario:
    Given a step
    And a step
    
  Scenario:
    Given a step
    But a step
    `
      )
      await harness.writeFile(
        'features/steps.js',
        `import { Given } from '@cucumber/node'
  Given('a step', () => {})
    `
      )

      const [output] = await harness.run('@cucumber/node/reporters/progress')
      const sanitised = stripVTControlCharacters(output.trim())

      expect(sanitised).to.include(
        '....\n' + '\n' + '2 scenarios (2 passed)\n' + '4 steps (4 passed)\n'
      )
    })
  })

  describe('pretty', () => {
    it('outputs the pretty format', async () => {
      const harness = await makeTestHarness()
      await harness.writeFile(
        'features/first.feature',
        `Feature:
  Scenario:
    Given a step
    And a step
    
  Scenario:
    Given a step
    But a step
    `
      )
      await harness.writeFile(
        'features/steps.js',
        `import { Given } from '@cucumber/node'
  Given('a step', () => {})
    `
      )

      const [output] = await harness.run('@cucumber/node/reporters/pretty')
      const sanitised = stripVTControlCharacters(output.trim())

      expect(sanitised).to.include(`Feature: 

  Scenario:        # features/first.feature:2
    ✔ Given a step # features/steps.js:2
    ✔ And a step   # features/steps.js:2

  Scenario:        # features/first.feature:6
    ✔ Given a step # features/steps.js:2
    ✔ But a step   # features/steps.js:2

2 scenarios (2 passed)
4 steps (4 passed)`)
    })
  })

  describe('junit', () => {
    it('outputs a junit xml report', async () => {
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

      const [output] = await harness.run('@cucumber/node/reporters/junit')

      expect(output).to.include(
        '<system-out><![CDATA[Given a step................................................................passed]]></system-out>'
      )
    })
  })
})
