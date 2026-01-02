import { TestEvent } from 'node:test/reporters'

import plugin from '@cucumber/junit-xml-formatter'
import { Envelope } from '@cucumber/messages'

import { generateEnvelopes } from '../generateEnvelopes.js'

export default async function* (source: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const output: string[] = []
  let handler: (envelope: Envelope) => void = () => {}
  plugin.formatter({
    on(_, newHandler) {
      handler = newHandler
    },
    write: (chunk) => output.push(chunk),
    options: {},
  })

  const envelopes = generateEnvelopes(source)
  for await (const envelope of envelopes) {
    handler(envelope)
  }

  for (const chunk of output) {
    yield chunk
  }
}
