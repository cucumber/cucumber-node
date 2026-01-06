import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { Envelope } from '@cucumber/messages'
import { expect } from 'chai'

import { EnvelopesReplaySubject } from './EnvelopesReplaySubject.js'
import { MessagesDeframer } from './MessagesDeframer.js'
import { EnvelopeFromFile } from './types.js'

describe('MessagesDeframer', () => {
  it('correctly reassembles envelopes from randomly chunked NDJSON', () => {
    const ndjsonPath = resolve(
      import.meta.dirname,
      '../../node_modules/@cucumber/compatibility-kit/features/minimal/minimal.ndjson'
    )
    const ndjsonContent = readFileSync(ndjsonPath, 'utf-8')

    // Transform raw envelopes to EnvelopeFromFile format
    const expectedEnvelopes: EnvelopeFromFile[] = ndjsonContent
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({
        file: 'minimal.ndjson',
        envelope: JSON.parse(line) as Envelope,
      }))

    // Create NDJSON in EnvelopeFromFile format
    const transformedNdjson = expectedEnvelopes.map((e) => JSON.stringify(e)).join('\n') + '\n'

    // Break into random-length chunks
    const chunks: Buffer<ArrayBuffer>[] = []
    let remaining = transformedNdjson
    while (remaining.length > 0) {
      const chunkSize = Math.floor(Math.random() * 50) + 1
      chunks.push(Buffer.from(remaining.slice(0, chunkSize)))
      remaining = remaining.slice(chunkSize)
    }

    // Collect results via subscription to a test-specific subject
    const subject = new EnvelopesReplaySubject()
    const collected: EnvelopeFromFile[] = []
    subject.subscribe((item) => collected.push(item))

    // Push chunks through deframer
    const deframer = new MessagesDeframer(subject)
    for (const chunk of chunks) {
      deframer.handle(chunk)
    }

    // Assert we got all envelopes correctly
    expect(collected).to.deep.equal(expectedEnvelopes)
  })
})
