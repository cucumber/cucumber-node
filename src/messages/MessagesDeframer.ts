import { EnvelopesReplaySubject } from './EnvelopesReplaySubject.js'
import { EnvelopeFromFile } from './types.js'

/**
 * Handles envelopes from files arriving in chunks, re-assembles them into discrete
 * items and forwards to the subject which multicasts to interested subscribers.
 */
/* c8 ignore next */
export class MessagesDeframer {
  private buffer = ''

  constructor(private readonly subject: EnvelopesReplaySubject) {}

  handle(data: Buffer<ArrayBuffer>) {
    this.buffer += data.toString()

    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      if (line) {
        try {
          const item = JSON.parse(line.toString()) as EnvelopeFromFile
          this.subject.next(item)
        } catch (e) {
          console.warn(`cucumber-node couldn't parse a message from a test:`, (e as Error).message)
        }
      }
    }
  }
}
