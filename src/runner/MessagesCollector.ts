import { Envelope } from '@cucumber/messages'

import { envelopes$ } from '../messages/index.js'

export class MessagesCollector {
  push(...envelopes: ReadonlyArray<Envelope>) {
    envelopes.forEach((envelope) => envelopes$.next(envelope))
  }
}
