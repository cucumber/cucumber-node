import fs from 'node:fs'
import { When } from '@cucumber/node'

When('the string {string} is attached as {string}', async (t, text, mediaType) => {
  await t.attach(text, { mediaType })
})

When('the string {string} is logged', async (t, text) => {
  await t.log(text)
})

When('text with ANSI escapes is logged', async (t) => {
  await t.log(
    'This displays a \x1b[31mr\x1b[0m\x1b[91ma\x1b[0m\x1b[33mi\x1b[0m\x1b[32mn\x1b[0m\x1b[34mb\x1b[0m\x1b[95mo\x1b[0m\x1b[35mw\x1b[0m'
  )
})

When('the following string is attached as {string}:', async (t, mediaType, text) => {
  await t.attach(text, { mediaType })
})

When('an array with {int} bytes is attached as {string}', async (t, size, mediaType) => {
  const data = [...Array(size).keys()]
  const buffer = Buffer.from(data)
  await t.attach(buffer, { mediaType })
})

When('a PDF document is attached and renamed', async (t) => {
  await t.attach(fs.createReadStream(import.meta.dirname + '/document.pdf'), {
    mediaType: 'application/pdf',
    fileName: 'renamed.pdf',
  })
})

When('a link to {string} is attached', async (t, uri) => {
  await t.link(uri)
})
