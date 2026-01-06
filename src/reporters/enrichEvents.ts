import { EventData } from 'node:test'
import { TestEvent } from 'node:test/reporters'

import {
  Envelope,
  TestStepFinished,
  TestStepResult,
  TestStepResultStatus,
  TestStepStarted,
} from '@cucumber/messages'
import { ArrayMultimap } from '@teppeis/multimaps'

import { makeTimestamp } from '../makeTimestamp.js'
import { EnvelopeFromFile, envelopesSubject, setupMessageListening } from '../messages/index.js'
import { newId } from '../newId.js'
import { mapTestStepResult } from './mapTestStepResult.js'
import { meta } from './meta.js'

await setupMessageListening()

export async function* enrichEvents(events: AsyncIterable<TestEvent>): AsyncGenerator<Envelope> {
  const completeEventsByFile: ArrayMultimap<string, EventData.TestComplete> = new ArrayMultimap()
  const testStepKeysByFile: ArrayMultimap<string, string> = new ArrayMultimap()
  const envelopesQueue: Array<EnvelopeFromFile> = []
  const testRunStartedId = newId()
  let success = true

  envelopesSubject.subscribe((event) => envelopesQueue.push(event))

  yield { meta }
  yield {
    testRunStarted: {
      id: testRunStartedId,
      timestamp: makeTimestamp(),
    },
  }

  for await (const event of events) {
    switch (event.type) {
      case 'test:complete': {
        if (isFromCucumberStep(event.data)) {
          completeEventsByFile.put(event.data.file as string, event.data)
        }
        break
      }
      default:
        break
    }
    while (envelopesQueue.length > 0) {
      const { file, envelope } = envelopesQueue.shift() as EnvelopeFromFile
      if (envelope.testCase) {
        envelope.testCase.testRunStartedId = testRunStartedId
      } else if (envelope.testStepStarted) {
        testStepKeysByFile.put(file, deriveKey(envelope.testStepStarted))
      } else if (envelope.testStepFinished) {
        const completeEvent = completeEventsByFile
          .get(file)
          .at(testStepKeysByFile.get(file).indexOf(deriveKey(envelope.testStepFinished)))
        if (!completeEvent) {
          envelopesQueue.unshift({ file, envelope })
          break
        }
        envelope.testStepFinished.testStepResult = mapTestStepResult(completeEvent)
        if (isNonSuccess(envelope.testStepFinished.testStepResult)) {
          success = false
        }
      }
      yield envelope
    }
  }

  yield {
    testRunFinished: {
      testRunStartedId,
      timestamp: makeTimestamp(),
      success,
    },
  }
}

function isFromCucumberStep(eventData: EventData.TestComplete) {
  return (
    (eventData.file?.endsWith('.feature') || eventData.file?.endsWith('.feature.md')) &&
    eventData.nesting === 2
  )
}

function deriveKey(message: TestStepStarted | TestStepFinished) {
  return message.testCaseStartedId + '/' + message.testStepId
}

function isNonSuccess(testStepResult: TestStepResult) {
  return ![
    TestStepResultStatus.UNKNOWN,
    TestStepResultStatus.PASSED,
    TestStepResultStatus.SKIPPED,
  ].includes(testStepResult.status)
}
