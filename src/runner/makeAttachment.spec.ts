import { PassThrough } from 'node:stream'

import { AttachmentContentEncoding } from '@cucumber/messages'
import { expect } from 'chai'

import { makeAttachment, makeLink, makeLog } from './makeAttachment.js'

describe('makeAttachment', () => {
  const original = 'foo bar'
  const base64 = btoa(original)

  it('correctly handles a string', async () => {
    const result = await makeAttachment(original, { mediaType: 'text/plain' })
    expect(result.body).to.eq(original)
    expect(result.contentEncoding).to.eq(AttachmentContentEncoding.IDENTITY)
    expect(result.timestamp).to.be.ok
  })

  it('correctly handles a buffer', async () => {
    const result = await makeAttachment(Buffer.from(original, 'utf8'), { mediaType: 'text/plain' })
    expect(result.body).to.eq(base64)
    expect(result.contentEncoding).to.eq(AttachmentContentEncoding.BASE64)
    expect(result.timestamp).to.be.ok
  })

  it('correctly handles a stream', async () => {
    const stream = new PassThrough()
    stream.write(original)
    stream.end()
    const result = await makeAttachment(stream, { mediaType: 'text/plain' })
    expect(result.body).to.eq(base64)
    expect(result.contentEncoding).to.eq(AttachmentContentEncoding.BASE64)
    expect(result.timestamp).to.be.ok
  })

  it('makes the correct attachment for a log', async () => {
    const result = await makeLog('a thing happened')
    expect(result.body).to.eq('a thing happened')
    expect(result.contentEncoding).to.eq(AttachmentContentEncoding.IDENTITY)
    expect(result.mediaType).to.eq('text/x.cucumber.log+plain')
    expect(result.timestamp).to.be.ok
  })

  it('makes the correct attachment for a link', async () => {
    const result = await makeLink('https://cucumber.io', 'Cucumber')
    expect(result.body).to.eq('https://cucumber.io')
    expect(result.fileName).to.eq('Cucumber')
    expect(result.contentEncoding).to.eq(AttachmentContentEncoding.IDENTITY)
    expect(result.mediaType).to.eq('text/uri-list')
    expect(result.timestamp).to.be.ok
  })
})
