import { Before, After, When } from '@cucumber/node'

Before({ tagFilter: '@passing-hook' }, async () => {
  // no-op
})

Before({ tagFilter: '@fail-before' }, () => {
  throw new Error('Exception in conditional hook')
})

When('a step passes', () => {
  // no-op
})

After({ tagFilter: '@fail-after' }, () => {
  throw new Error('Exception in conditional hook')
})

After({ tagFilter: '@passing-hook' }, async () => {
  // no-op
})
