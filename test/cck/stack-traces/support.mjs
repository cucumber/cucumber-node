import { When } from '@cucumber/node'

When('a step throws an exception', () => {
  throw new Error('BOOM')
})
