import { When, Then } from '@cucumber/node'
import assert from 'node:assert'

When('the following table is transposed:', (t, table) => {
  t.world.transposed = table.transpose()
})

Then('it should be:', (t, expected) => {
  assert.deepStrictEqual(t.world.transposed.raw(), expected.raw())
})
