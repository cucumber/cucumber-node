import { When } from '@cucumber/node'
import fs from 'node:fs'

When('a JPEG image is attached', async (t) => {
  await t.attach(fs.createReadStream(import.meta.dirname + '/cucumber.jpeg'), {
    mediaType: 'image/jpeg',
  })
})

When('a PNG image is attached', async (t) => {
  await t.attach(fs.createReadStream(import.meta.dirname + '/cucumber.png'), {
    mediaType: 'image/png',
  })
})
