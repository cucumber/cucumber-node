import { EventEmitter } from 'node:events'

import { EnvelopeFromFile } from './types.js'

/**
 * A minimal implementation of a "ReplaySubject" (ala rxjs) to wrap an event emitter
 * for envelopes from files and buffer early items for the benefit of late subscribers.
 */
export class EnvelopesReplaySubject {
  private readonly buffer: Array<EnvelopeFromFile> = []
  private readonly eventEmitter: EventEmitter<{
    item: [EnvelopeFromFile]
  }> = new EventEmitter()
  private buffering = true

  next(item: EnvelopeFromFile) {
    if (item.envelope.testCaseStarted) {
      /*
      Once we see a TestCaseStarted, the actual test runner stuff is underway, and we can
      reasonably assume any listener is already active, so there's no need to buffer any more.
       */
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
