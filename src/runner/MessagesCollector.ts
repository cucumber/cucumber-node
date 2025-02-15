import { TestContext } from 'node:test'

import { Envelope } from '@cucumber/messages'

export const PROTOCOL_PREFIX = '@cucumber/messages:'

export interface MessagesCollector {
  connect(nodeTestContext: TestContext): void
  push(...envelopes: ReadonlyArray<Envelope>): void
}

export class DiagnosticMessagesCollector implements MessagesCollector {
  private queue: Array<Envelope> = []
  private context: TestContext | undefined

  private serialise(envelope: Envelope) {
    return PROTOCOL_PREFIX + JSON.stringify(envelope)
  }

  connect(context: TestContext) {
    this.context = context
    if (this.queue.length) {
      this.queue.splice(0).forEach((envelope) => context.diagnostic(this.serialise(envelope)))
    }
  }

  push(...envelopes: ReadonlyArray<Envelope>) {
    if (this.context) {
      for (const envelope of envelopes) {
        this.context.diagnostic(this.serialise(envelope))
      }
    } else {
      this.queue.push(...envelopes)
    }
  }
}

export class NoopMessagesCollector implements MessagesCollector {
  connect() {}
  push() {}
}
