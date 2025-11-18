import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'
import path from 'node:path'
import { TestStepResultStatus } from '@cucumber/messages'

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
      expect(sanitised).to.include('test at features/foo.feature:1:1')
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
      expect(sanitised).to.include('No matching step definitions found for text "a step"')
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

      const query = await harness.collectMessages()

      expect(query.findAllTestCaseStarted().length).to.eq(1)
      expect(
        query
          .findAllTestCaseStarted()
          .map((testCaseStarted) => query.findMostSevereTestStepResultBy(testCaseStarted)?.status)
      ).to.deep.eq([TestStepResultStatus.PASSED])
      expect(query.findTestRunFinished()?.success).to.be.true
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
