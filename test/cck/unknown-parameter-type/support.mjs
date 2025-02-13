import { Given } from '@cucumber/node'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Given('{airport} is closed because of a strike', (t, airport) => {
  throw new Error('Should not be called because airport parameter type has not been defined')
})
