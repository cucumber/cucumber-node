import { TestStepResultStatus } from '@cucumber/messages'
import { Query } from '@cucumber/query'
import { expect } from 'chai'

import { makeTestHarness } from '../utils.js'

describe('Messages', () => {
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
