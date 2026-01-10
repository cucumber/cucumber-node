import { TestEvent } from 'node:test/reporters'

import { enrichMessages } from '../enrichMessages.js'

export default async function* (events: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const envelopes = enrichMessages(events)
  for await (const envelope of envelopes) {
    yield JSON.stringify(envelope) + '\n'
  }
}
