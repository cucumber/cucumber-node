import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { Envelope } from '@cucumber/messages'
import { expect } from 'chai'

import { EnvelopesReplaySubject } from './EnvelopesReplaySubject.js'
import { MessagesDeframer } from './MessagesDeframer.js'
import { EnvelopeFromFile } from './types.js'

describe('MessagesDeframer', () => {
  it('correctly reassembles envelopes from randomly chunked ndjson', () => {
    // grab real envelopes of a full test run, wrap them to match our from-file shape
    const expectedEnvelopes: EnvelopeFromFile[] = readFileSync(
      resolve(
        import.meta.dirname,
        '../../node_modules/@cucumber/compatibility-kit/features/minimal/minimal.ndjson'
      ),
      'utf-8'
    )
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => ({
        file: 'features/minimal.feature',
        envelope: JSON.parse(line) as Envelope,
      }))

    // break into random-length chunks, simulating ipc behaviour
    const ndjson = expectedEnvelopes.map((e) => JSON.stringify(e)).join('\n') + '\n'
    const chunks: Buffer<ArrayBuffer>[] = []
    let remaining = ndjson
    while (remaining.length > 0) {
      const chunkSize = Math.floor(Math.random() * 50) + 1
      chunks.push(Buffer.from(remaining.slice(0, chunkSize)))
      remaining = remaining.slice(chunkSize)
    }

    // subscribe to re-assembled items
    const subject = new EnvelopesReplaySubject()
    const reassembled: EnvelopeFromFile[] = []
    subject.subscribe((item) => reassembled.push(item))

    // push chunks through deframer
    const deframer = new MessagesDeframer(subject)
    for (const chunk of chunks) {
      deframer.handle(chunk)
    }

    expect(reassembled).to.deep.equal(expectedEnvelopes)
  })
})
