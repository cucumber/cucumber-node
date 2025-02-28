import assert from 'assert'
import { Given, When, Then } from '@cucumber/node'

Given('some TypeScript code:', (dataTable) => {
  assert(dataTable)
})

Given('some classic Gherkin:', (gherkin) => {
  assert(gherkin)
})

When('we use a data table and attach something and then {word}', (t, word, dataTable) => {
  assert(dataTable)
  t.log(`We are logging some plain text (${word})`)
  if (word === 'fail') {
    throw new Error('You asked me to fail')
  }
})

Then('this might or might not run', () => {
  // no-op
})
