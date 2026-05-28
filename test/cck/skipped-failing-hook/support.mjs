import { After, Given } from '@cucumber/node'

Given('a step that skips', (t) => t.skip())

After({}, () => {
  throw new Error('whoops')
})
