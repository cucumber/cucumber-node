import type { EventData } from 'node:test'

import {
  type Exception,
  type TestStepResult,
  TestStepResultStatus,
  TimeConversion,
} from '@cucumber/messages'

export function mapTestStepResult(
  testEvent: EventData.TestFail | EventData.TestPass
): TestStepResult {
  let status: TestStepResultStatus = TestStepResultStatus.PASSED
  let exception: Exception | undefined
  if (testEvent.skip) {
    status = TestStepResultStatus.SKIPPED
  } else if (testEvent.todo) {
    status = TestStepResultStatus.PENDING
  } else if ('error' in testEvent.details) {
    const cause = testEvent.details.error.cause as Error
    if (cause.message.startsWith('No matching step definitions found')) {
      status = TestStepResultStatus.UNDEFINED
    } else if (cause.message.startsWith('Multiple matching step definitions found')) {
      status = TestStepResultStatus.AMBIGUOUS
    } else {
      status = TestStepResultStatus.FAILED
      exception = {
        type: cause.name,
      }
    }
  }

  return {
    duration: TimeConversion.millisecondsToDuration(testEvent.details.duration_ms),
    status,
    exception,
  }
}
