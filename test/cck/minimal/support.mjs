import assert from 'node:assert'
import { Given } from '@cucumber/node'

Given('I have {int} cukes in my belly', ({}, cukeCount) => {
  assert(cukeCount)
})
