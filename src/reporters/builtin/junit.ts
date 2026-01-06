import { TestEvent } from 'node:test/reporters'

import plugin from '@cucumber/junit-xml-formatter'
import { Envelope } from '@cucumber/messages'

import { enrichEvents } from '../enrichEvents.js'

export default async function* (events: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const output: string[] = []
  let handler: (envelope: Envelope) => void = () => {}
  plugin.formatter({
    on(_, newHandler) {
      handler = newHandler
    },
    write: (chunk) => output.push(chunk),
    options: {},
  })

  const envelopes = enrichEvents(events)
  for await (const envelope of envelopes) {
    handler(envelope)
  }

  for (const chunk of output) {
    yield chunk
  }
}
