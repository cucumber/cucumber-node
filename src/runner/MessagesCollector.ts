import { Envelope } from '@cucumber/messages'

import { envelopesSubject } from '../messages/index.js'

export class MessagesCollector {
  constructor(private readonly file: string) {}

  push(...envelopes: ReadonlyArray<Envelope>) {
    envelopes.forEach((envelope) =>
      envelopesSubject.next({
        file: this.file,
        envelope,
      })
    )
  }
}
