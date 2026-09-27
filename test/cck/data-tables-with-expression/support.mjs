import { Given } from '@cucumber/node'
import assert from 'node:assert'

Given('a {string} with a table', (t, string, table) => {
  assert.strictEqual(string, 'Cucumber')
  assert.deepStrictEqual(table.raw(), [['Species', 'Cucumis sativus']])
})
