import { Envelope } from '@cucumber/messages'

import { EnvelopesReplaySubject } from '../messages/index.js'

export class MessagesCollector {
  constructor(
    private readonly file: string,
    private readonly subject: EnvelopesReplaySubject
  ) {}

  push(...envelopes: ReadonlyArray<Envelope>) {
    envelopes.forEach((envelope) =>
      this.subject.next({
        file: this.file,
        envelope,
      })
    )
  }
}
