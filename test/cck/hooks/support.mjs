import fs from 'node:fs'
import path from 'node:path'
import {Before,After,When} from '@cucumber/node'

Before(() => {
  // no-op
})

Before({name: 'A named hook'}, () => {
  // no-op
})

When('a step passes', () => {
  // no-op
})

When('a step fails', () => {
  throw new Error('Exception in step')
})

After(() => {
  // no-op
})

After({
  tagFilter: '@some-tag or @some-other-tag'
}, () => {
  throw new Error('Exception in conditional hook')
})

After({tagFilter: '@with-attachment'}, async (t) => {
  await t.attach(fs.createReadStream(path.join(
    import.meta.dirname,
    'cucumber.svg',
  )), {mediaType: 'image/svg+xml'})
})