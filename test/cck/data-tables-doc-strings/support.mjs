import { Given } from '@cucumber/node'
import assert from 'node:assert'

Given('a step with a data table a doc string', (t, table, string) => {
  assert.deepStrictEqual(table.raw(), [['hello']])
  assert.deepStrictEqual(string, 'world')
})

Given('a step with a doc string a data table', (t, string, table) => {
  assert.deepStrictEqual(string, 'hello')
  assert.deepStrictEqual(table.raw(), [['world']])
})
