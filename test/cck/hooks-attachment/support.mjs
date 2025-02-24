import fs from 'node:fs'
import {Before,After,When} from '@cucumber/node'

Before(async (t) => {
  await t.attach(fs.createReadStream(import.meta.dirname + '/cucumber.svg'), {mediaType: 'image/svg+xml'})
})

When('a step passes', () => {
  // no-op
})

After(async (t) => {
  await t.attach(fs.createReadStream(import.meta.dirname + '/cucumber.svg'), {mediaType: 'image/svg+xml'})
})