import { EventData } from 'node:test'

import { TestStepResultStatus } from '@cucumber/messages'
import { expect } from 'chai'

import { mapTestStepResult } from './mapTestStepResult.js'

describe('mapTestStepResult', () => {
  it('returns SKIPPED when skip is true', () => {
    const testEvent = {
      skip: true,
      details: { duration_ms: 100 },
    } as EventData.TestPass

    const result = mapTestStepResult(testEvent)

    expect(result.status).to.eq(TestStepResultStatus.SKIPPED)
  })

  it('returns PENDING when todo is true', () => {
    const testEvent = {
      todo: true,
      details: { duration_ms: 100 },
    } as EventData.TestPass

    const result = mapTestStepResult(testEvent)

    expect(result.status).to.eq(TestStepResultStatus.PENDING)
  })

  it('returns UNDEFINED when error message starts with "No matching step definitions found"', () => {
    const testEvent = {
      details: {
        duration_ms: 100,
        error: {
          cause: {
            name: 'Error',
            message: 'No matching step definitions found for this step',
          },
        },
      },
    } as EventData.TestFail

    const result = mapTestStepResult(testEvent)

    expect(result.status).to.eq(TestStepResultStatus.UNDEFINED)
    expect(result.exception).to.be.undefined
  })

  it('returns AMBIGUOUS when error message starts with "Multiple matching step definitions found"', () => {
    const testEvent = {
      details: {
        duration_ms: 100,
        error: {
          cause: {
            name: 'Error',
            message: 'Multiple matching step definitions found for this step',
          },
        },
      },
    } as EventData.TestFail

    const result = mapTestStepResult(testEvent)

    expect(result.status).to.eq(TestStepResultStatus.AMBIGUOUS)
    expect(result.exception).to.be.undefined
  })

  it('returns FAILED with exception for other errors', () => {
    const testEvent = {
      details: {
        duration_ms: 100,
        error: {
          cause: {
            name: 'AssertionError',
            message: 'expected true to be false',
          },
        },
      },
    } as EventData.TestFail

    const result = mapTestStepResult(testEvent)

    expect(result.status).to.eq(TestStepResultStatus.FAILED)
    expect(result.exception).to.deep.eq({ type: 'AssertionError' })
  })

  it('returns PASSED when there is no skip, todo, or error', () => {
    const testEvent = {
      details: { duration_ms: 100 },
    } as EventData.TestPass

    const result = mapTestStepResult(testEvent)

    expect(result.status).to.eq(TestStepResultStatus.PASSED)
  })

  it('correctly converts duration from milliseconds', () => {
    const testEvent = {
      details: { duration_ms: 1500 },
    } as EventData.TestPass

    const result = mapTestStepResult(testEvent)

    expect(result.duration.seconds).to.eq(1)
    expect(result.duration.nanos).to.eq(500000000)
  })
})
