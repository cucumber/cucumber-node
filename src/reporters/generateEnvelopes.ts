import { EventData } from 'node:test'
import { TestEvent } from 'node:test/reporters'

import {
  Envelope,
  TestRunStarted,
  TestStepFinished,
  TestStepResult,
  TestStepResultStatus,
} from '@cucumber/messages'

import { makeTimestamp } from '../makeTimestamp.js'
import { eventEmitter, setupMessageListening } from '../messages/index.js'
import { newId } from '../newId.js'
import { mapTestStepResult } from './mapTestStepResult.js'
import { meta } from './meta.js'

await setupMessageListening()
const rawEnvelopes: Array<Envelope> = []
eventEmitter.on('envelope', (envelope) => rawEnvelopes.push(envelope))

export async function* generateEnvelopes(
  source: AsyncIterable<TestEvent>
): AsyncGenerator<Envelope> {
  yield { meta }

  const nodeFailOrPassEvents: Array<EventData.TestFail | EventData.TestPass> = []
  const testStepFinishedMessages: Array<TestStepFinished> = []
  const testRunEnvelopes: Array<Envelope> = []

  const testRunStarted: TestRunStarted = {
    id: newId(),
    timestamp: makeTimestamp(),
  }

  for await (const event of source) {
    switch (event.type) {
      case 'test:fail':
      case 'test:pass':
        if (isFromHere(event.data) && event.data.nesting === 2) {
          nodeFailOrPassEvents.push(event.data)
        }
        break
      default:
        break
    }
  }

  const testRunFinished = {
    testRunStartedId: testRunStarted.id,
    timestamp: makeTimestamp(),
    success: true,
  }

  for (const envelope of rawEnvelopes) {
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
        case 'suggestion':
          testRunEnvelopes.push(envelope)
          break
        case 'testStepFinished':
          {
            const testStepFinished = envelope.testStepFinished!
            testStepFinishedMessages.push(testStepFinished)
            testStepFinished.testStepResult = mapTestStepResult(
              nodeFailOrPassEvents.at(testStepFinishedMessages.indexOf(testStepFinished))
            )
            if (isNonSuccess(testStepFinished.testStepResult)) {
              testRunFinished.success = false
            }
            testRunEnvelopes.push(envelope)
          }
          break
        default:
          yield envelope
          break
      }
    }
  }
  yield { testRunStarted }
  for (const envelope of testRunEnvelopes) {
    yield envelope
  }
  yield { testRunFinished }
}

function isFromHere(testLocationInfo: EventData.LocationInfo) {
  return (
    testLocationInfo.file?.endsWith('.feature') || testLocationInfo.file?.endsWith('.feature.md')
  )
}

function isNonSuccess(testStepResult: TestStepResult) {
  return ![
    TestStepResultStatus.UNKNOWN,
    TestStepResultStatus.PASSED,
    TestStepResultStatus.SKIPPED,
  ].includes(testStepResult.status)
}
