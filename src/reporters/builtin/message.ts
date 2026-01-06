import { TestEvent } from 'node:test/reporters'

import { enrichEvents } from '../enrichEvents.js'

export default async function* (events: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const envelopes = enrichEvents(events)
  for await (const envelope of envelopes) {
    yield JSON.stringify(envelope) + '\n'
  }
}
