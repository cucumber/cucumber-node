import { TestEvent } from 'node:test/reporters'

import { generateEnvelopes } from '../generateEnvelopes.js'

/*
Signal to the runner that we are listening for messages so it should emit them
 */
process.env.CUCUMBER_MESSAGES_LISTENING = 'true'

export default async function* (source: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const envelopes = generateEnvelopes(source)
  for await (const envelope of envelopes) {
    yield JSON.stringify(envelope) + '\n'
  }
}
