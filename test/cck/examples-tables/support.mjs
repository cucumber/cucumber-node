import assert from 'assert'
import { Given, When, Then } from '@cucumber/node'

Given('there are {int} cucumbers', (t, initialCount) => {
  t.world.count = initialCount
})

Given('there are {int} friends', (t, initialFriends) => {
  t.world.friends = initialFriends
})

When('I eat {int} cucumbers', (t, eatCount) => {
  t.world.count -= eatCount
})

Then('I should have {int} cucumbers', (t, expectedCount) => {
  assert.strictEqual(t.world.count, expectedCount)
})

Then('each person can eat {int} cucumbers', (t, expectedShare) => {
  const share = Math.floor(t.world.count / (1 + t.world.friends))
  assert.strictEqual(share, expectedShare)
})
