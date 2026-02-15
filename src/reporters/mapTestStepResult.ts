import { EventData } from 'node:test'

import { TestStepResult, TestStepResultStatus, TimeConversion } from '@cucumber/messages'

export function mapTestStepResult(
  testEvent: EventData.TestFail | EventData.TestPass
): TestStepResult {
  let status: TestStepResultStatus = TestStepResultStatus.PASSED
  let exception = undefined
  if (testEvent.skip) {
    status = TestStepResultStatus.SKIPPED
  } else if (testEvent.todo) {
    status = TestStepResultStatus.PENDING
  } else if ('error' in testEvent.details) {
    const error = testEvent.details.error
    if (error.cause.message.startsWith('No matching step definitions found')) {
      status = TestStepResultStatus.UNDEFINED
    } else if (error.cause.message.startsWith('Multiple matching step definitions found')) {
      status = TestStepResultStatus.AMBIGUOUS
    } else {
      status = TestStepResultStatus.FAILED
      exception = {
        type: error.cause.constructor.name,
      }
    }
  }

  return {
    duration: TimeConversion.millisecondsToDuration(testEvent.details.duration_ms),
    status,
    exception,
  }
}
