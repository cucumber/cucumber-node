import { Before, Given } from '@cucumber/node'

Before({ tags: '@skip' }, (t) => t.skip())

Given('a step that does not skip', () => {
  // no-op
})

Given('a step that is skipped', () => {
  // no-op
})

Given('I skip a step', (t) => t.skip())
