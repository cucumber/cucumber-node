import { TestEvent } from 'node:test/reporters'

import {
  ProgressBarOptions,
  ProgressBarPrinter,
} from '@cucumber/pretty-formatter'

import { enrichMessages } from '../enrichMessages.js'
import { proxyStream } from '../proxyStream.js'

const options: ProgressBarOptions = {
}

export default async function* (events: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const buffer: Array<string> = []
  const stream = proxyStream(process.stdout, (content: string) => buffer.push(content))
  const printer = new ProgressBarPrinter({ stream, options })
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
