import { finished } from 'node:stream/promises'
import { TestEvent } from 'node:test/reporters'

import { CucumberHtmlStream } from '@cucumber/html-formatter'

import { generateEnvelopes } from '../generateEnvelopes.js'

export default async function* (source: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  const output: string[] = []

  const htmlStream = new CucumberHtmlStream()
  htmlStream.on('data', (chunk) => output.push(chunk))

  const envelopes = generateEnvelopes(source)
  for await (const envelope of envelopes) {
    htmlStream.write(envelope)
  }

  htmlStream.end()
  await finished(htmlStream)

  for (const chunk of output) {
    yield chunk
  }
}
