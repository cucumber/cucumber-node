import { finished } from 'node:stream/promises'
import { TestEvent } from 'node:test/reporters'

import { CucumberHtmlStream } from '@cucumber/html-formatter'

import { enrichEvents } from '../enrichEvents.js'

export default async function* (events: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const output: string[] = []

  const htmlStream = new CucumberHtmlStream()
  htmlStream.on('data', (chunk) => output.push(chunk))

  const envelopes = enrichEvents(events)
  for await (const envelope of envelopes) {
    htmlStream.write(envelope)
  }

  htmlStream.end()
  await finished(htmlStream)

  for (const chunk of output) {
    yield chunk
  }
}
