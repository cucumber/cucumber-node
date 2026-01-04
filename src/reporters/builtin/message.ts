import { TestEvent } from 'node:test/reporters'

import { generateEnvelopes } from '../generateEnvelopes.js'

export default async function* (source: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const envelopes = generateEnvelopes(source)
  for await (const envelope of envelopes) {
    yield JSON.stringify(envelope) + '\n'
  }
}
