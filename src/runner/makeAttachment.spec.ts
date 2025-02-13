import { PassThrough } from 'node:stream'

import { AttachmentContentEncoding } from '@cucumber/messages'
import { expect } from 'chai'

import { makeAttachment } from './makeAttachment.js'

describe('makeAttachment', () => {
  const original = 'foo bar'
  const base64 = btoa(original)

  it('correctly handles a string', async () => {
    const result = await makeAttachment(original, { mediaType: 'text/plain' })
    expect(result.body).to.eq(original)
    expect(result.contentEncoding).to.eq(AttachmentContentEncoding.IDENTITY)
  })

  it('correctly handles a buffer', async () => {
    const result = await makeAttachment(Buffer.from(original, 'utf8'), { mediaType: 'text/plain' })
    expect(result.body).to.eq(base64)
    expect(result.contentEncoding).to.eq(AttachmentContentEncoding.BASE64)
  })

  it('correctly handles a stream', async () => {
    const stream = new PassThrough()
    stream.write(original)
    stream.end()
    const result = await makeAttachment(stream, { mediaType: 'text/plain' })
    expect(result.body).to.eq(base64)
    expect(result.contentEncoding).to.eq(AttachmentContentEncoding.BASE64)
  })
})
