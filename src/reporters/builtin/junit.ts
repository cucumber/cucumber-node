import type { TestEvent } from 'node:test/reporters'

import { JUnitXmlPrinter } from '@cucumber/junit-xml-formatter'

import { enrichMessages } from '../enrichMessages.js'

export default async function* (events: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const buffer: Array<string> = []
  const printer = new JUnitXmlPrinter({}, (chunk) => buffer.push(chunk))
  const envelopes = enrichMessages(events)
  for await (const envelope of envelopes) {
    printer.update(envelope)
    if (buffer.length) {
      const togo = buffer.splice(0)
      for (const content of togo) {
        yield content
      }
    }
  }
}
