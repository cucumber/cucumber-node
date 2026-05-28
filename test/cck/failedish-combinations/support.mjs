import { Given } from '@cucumber/node'

Given(/^a step$/, () => {
  // no-op
})

Given(/^a skipped step$/, (t) => t.skip())

Given(/^a pending step$/, (t) => t.todo())

Given(/^an ambiguous (.*?)$/, () => {})

Given(/^(.*?) ambiguous step$/, () => {})

Given(/^a failing step$/, () => {
  throw new Error('whoops')
})
