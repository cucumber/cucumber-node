import { Given, When, Then } from '@cucumber/node'
import assert from 'node:assert'

Given('there are {int} cucumbers', (t, initialCount) => {
  t.world.count = initialCount
})

When('I eat {int} cucumbers', (t, eatCount) => {
  t.world.count -= eatCount
})

Then('I should have {int} cucumbers', (t, expectedCount) => {
  assert.strictEqual(t.world.count, expectedCount)
})
