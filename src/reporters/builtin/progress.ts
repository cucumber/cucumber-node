import { TestEvent } from 'node:test/reporters'

import { ProgressPrinter } from '@cucumber/pretty-formatter'

import { enrichMessages } from '../enrichMessages.js'

export default async function* (events: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const buffer: Array<string> = []
  const printer = new ProgressPrinter(process.stdout, (content: string) => buffer.push(content))
  const envelopes = enrichMessages(events)
  for await (const envelope of envelopes) {
    printer.update(envelope)
    if (envelope.testRunFinished) {
      printer.summarise()
    }
    if (buffer.length) {
      const togo = buffer.splice(0)
      for (const content of togo) {
        yield content
      }
    }
  }
}
