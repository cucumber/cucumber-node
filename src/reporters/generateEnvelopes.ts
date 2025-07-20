import path from 'node:path'
import { TestEvent } from 'node:test/reporters'

import { Envelope, TestRunStarted, TestStepFinished } from '@cucumber/messages'

import { makeId } from '../makeId.js'
import { makeTimestamp } from '../makeTimestamp.js'
import { PROTOCOL_PREFIX } from '../runner/MessagesCollector.js'
import { mapTestStepResult } from './mapTestStepResult.js'
import { meta } from './meta.js'

export async function* generateEnvelopes(
  source: AsyncIterable<TestEvent>
): AsyncGenerator<Envelope> {
  yield { meta }

  const testRunEnvelopes: Array<Envelope> = []
  const testStepFinishedMessages: Array<TestStepFinished> = []
  const failOrPassEvents: Array<TestFail | TestPass> = []

  let success: boolean = false
  const testRunStarted: TestRunStarted = {
    id: makeId(),
    timestamp: makeTimestamp(),
  }

  for await (const event of source) {
    switch (event.type) {
      case 'test:fail':
      case 'test:pass':
        if (isFromHere(event.data) && event.data.nesting === 2) {
          failOrPassEvents.push(event.data)
        }
        break
      case 'test:summary':
        success = event.data.success
        break
      case 'test:diagnostic':
        if (isFromHere(event.data) && isEnvelope(event.data.message)) {
          const envelope = fromPrefixed(event.data.message)
          for (const key of Object.keys(envelope) as ReadonlyArray<keyof Envelope>) {
            switch (key) {
              case 'testCase':
                envelope.testCase!.testRunStartedId = testRunStarted.id
                testRunEnvelopes.push(envelope)
                break
              case 'testCaseStarted':
              case 'testCaseFinished':
              case 'testStepStarted':
              case 'attachment':
                testRunEnvelopes.push(envelope)
                break
              case 'testStepFinished':
                {
                  const testStepFinished = envelope.testStepFinished!
                  testStepFinishedMessages.push(testStepFinished)
                  testStepFinished.testStepResult = mapTestStepResult(
                    failOrPassEvents.at(testStepFinishedMessages.indexOf(testStepFinished))
                  )
                  testRunEnvelopes.push(envelope)
                }
                break
              default:
                yield envelope
                break
            }
          }
        }
        break
      default:
        break
    }
  }

  const testRunFinished = {
    testRunStartedId: testRunStarted.id,
    timestamp: makeTimestamp(),
    success,
  }

  yield { testRunStarted }
  for (const envelope of testRunEnvelopes) {
    yield envelope
  }
  yield { testRunFinished }
}

function isFromHere(testLocationInfo: TestLocationInfo) {
  return testLocationInfo.file?.startsWith(path.join(import.meta.dirname, '..'))
}

function isEnvelope(data: string) {
  return data.startsWith(PROTOCOL_PREFIX)
}

function fromPrefixed(data: string): Envelope {
  return JSON.parse(data.substring(PROTOCOL_PREFIX.length))
}
