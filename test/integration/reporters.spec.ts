import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'
import path from 'node:path'
import { TestStepResultStatus } from '@cucumber/messages'
import { Query } from '@cucumber/query'

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

    it('does not emit messages as diagnostics if no cucumber reporters', async () => {
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
      const [output] = await harness.run('spec')
      const sanitised = stripVTControlCharacters(output.trim())
      expect(sanitised).not.to.include('@cucumber/messages:')
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

  describe('message', () => {
    it('only factors cucumber tests into results', async () => {
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
        'example.test.mjs',
        `import test from 'node:test'
test('top level', (t) => {
    test('next level', (t1) => {
        t1.test('failing test', (t2) => {
            t2.assert.strictEqual(1, 2)
        })
    })
})
`
      )

      const query = new Query()
      await harness.run(query)

      expect(query.findAllTestCaseStarted().length).to.eq(1)
      expect(
        query
          .findAllTestCaseStarted()
          .map((testCaseStarted) => query.findMostSevereTestStepResultBy(testCaseStarted)?.status)
      ).to.deep.eq([TestStepResultStatus.PASSED])
      expect(query.findTestRunFinished()?.success).to.be.true
    })

    it('correctly populates test step results from test runner events', async () => {
      const harness = await makeTestHarness()

      for (let i = 0; i < 10; i++) {
        await harness.writeFile(
          `features/feature${i}.feature`,
          `Feature:
  Scenario: passing
    Given a step
    And a step
    And a step
    
  Scenario: failing
    Given a step
    And a failing step
    And a step
    
  Scenario: passing again
    Given a step
    And a step
`
        )
      }

      await harness.writeFile(
        'features/steps.js',
        `import { Given } from '@cucumber/node'
import { setTimeout } from 'node:timers/promises'
Given('a step', async () => {
  await setTimeout(Math.round(Math.random() * 100))
})
Given('a failing step', async () => {
  await setTimeout(Math.round(Math.random() * 100))
  throw new Error('nope')
})
`
      )

      const query = new Query()
      await harness.run(query)

      expect(query.countMostSevereTestStepResultStatus()).to.deep.eq({
        [TestStepResultStatus.AMBIGUOUS]: 0,
        [TestStepResultStatus.FAILED]: 10,
        [TestStepResultStatus.PASSED]: 20,
        [TestStepResultStatus.PENDING]: 0,
        [TestStepResultStatus.SKIPPED]: 0,
        [TestStepResultStatus.UNDEFINED]: 0,
        [TestStepResultStatus.UNKNOWN]: 0,
      })
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
