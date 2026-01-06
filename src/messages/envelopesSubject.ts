import EventEmitter from 'node:events'

import { EnvelopeFromFile } from './types.js'

class EnvelopesReplaySubject {
  private readonly buffer: Array<EnvelopeFromFile> = []
  private readonly eventEmitter: EventEmitter<{
    item: [EnvelopeFromFile]
  }> = new EventEmitter()
  private buffering = true

  next(item: EnvelopeFromFile) {
    if (item.envelope.testCaseStarted) {
      this.buffering = false
    }
    if (this.buffering) {
      this.buffer.push(item)
    }
    this.eventEmitter.emit('item', item)
  }

  subscribe(handler: (item: EnvelopeFromFile) => void) {
    this.buffer.forEach(handler)
    this.eventEmitter.on('item', handler)
  }
}

export const envelopesSubject = new EnvelopesReplaySubject()
