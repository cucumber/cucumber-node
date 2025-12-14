import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'
import { Query } from '@cucumber/query'

describe('Parameters', () => {
  it('awaits a promise returned by a parameter type transformer', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/foo.feature',
      `Feature: a feature
  Scenario: a scenario
    Given LHR-CDG has been delayed
    `
    )
    await harness.writeFile(
      'features/steps.js',
      `import assert from 'node:assert'
import { Given, ParameterType } from '@cucumber/node'

class Flight {
  from
  to

  constructor(from, to) {
    this.from = from
    this.to = to
  }
}

ParameterType({
  name: 'flight',
  regexp: /([A-Z]{3})-([A-Z]{3})/,
  transformer: (t, from, to) => Promise.resolve(new Flight(from, to)),
})

Given('{flight} has been delayed', (t, flight) => {
  assert.strictEqual(flight.from, 'LHR')
  assert.strictEqual(flight.to, 'CDG')
})
    `
    )
    const query = new Query()
    await harness.run(query)
    expect(query.findTestRunFinished()?.success).to.be.ok
  })
})
