import { Before, After, When } from '@cucumber/node'

Before({ tags: '@passing-hook' }, async () => {
  // no-op
})

Before({ tags: '@fail-before' }, () => {
  throw new Error('Exception in conditional hook')
})

When('a step passes', () => {
  // no-op
})

After({ tags: '@fail-after' }, () => {
  throw new Error('Exception in conditional hook')
})

After({ tags: '@passing-hook' }, async () => {
  // no-op
})
