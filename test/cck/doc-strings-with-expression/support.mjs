import { Given } from '@cucumber/node'
import assert from 'node:assert'

Given('a {string} with a doc string:', (t, string, docString) => {
  assert.strictEqual(string, 'Cucumber')
  assert.strictEqual(docString, 'Cucumis sativus')
})
