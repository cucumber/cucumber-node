import { Given } from '@cucumber/node'

Given('{airport} is closed because of a strike', (t, airport) => {
  throw new Error('Should not be called because airport parameter type has not been defined')
})
