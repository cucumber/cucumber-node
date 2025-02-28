import { Before, After, When } from '@cucumber/node'

Before(() => {
  // no-op
})

When('a step passes', () => {
  // no-op
})

When('a step fails', () => {
  throw new Error('Exception in step')
})

After(() => {
  // no-op
})
