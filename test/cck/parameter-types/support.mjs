import assert from 'node:assert'
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
  transformer: (t, from, to) => new Flight(from, to),
})

Given('{flight} has been delayed', (t, flight) => {
  assert.strictEqual(flight.from, 'LHR')
  assert.strictEqual(flight.to, 'CDG')
})
