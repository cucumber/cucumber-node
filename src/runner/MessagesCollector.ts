import { Envelope } from '@cucumber/messages'

import { eventEmitter } from '../messages/index.js'

export class MessagesCollector {
  push(...envelopes: ReadonlyArray<Envelope>) {
    envelopes.forEach((envelope) => eventEmitter.emit('envelope', envelope))
  }
}
