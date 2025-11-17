import { TestContext } from 'node:test'

import { AssembledTestCase } from '@cucumber/core'

import { makeTimestamp } from '../makeTimestamp.js'
import { newId } from '../newId.js'
import { World } from '../types.js'
import { ExecutableTestStep } from './ExecutableTestStep.js'
import { messages } from './state.js'
import { WorldFactory } from './WorldFactory.js'

export class ExecutableTestCase {
  public readonly id = newId()
  public world: World
  public outcomeKnown = false

  constructor(
    private readonly worldFactory: WorldFactory,
    private readonly testCase: AssembledTestCase
  ) {}

  get name(): string {
    return this.testCase.name
  }

  get testSteps(): ReadonlyArray<ExecutableTestStep> {
    return this.testCase.testSteps.map((ts) => {
      return new ExecutableTestStep(this, ts)
    })
  }

  async setup(nodeTestContext: TestContext) {
    messages.connect(nodeTestContext)
    messages.push({
      testCaseStarted: {
        id: this.id,
        testCaseId: this.testCase.id,
        attempt: 0,
        timestamp: makeTimestamp(),
      },
    })

    this.world = await this.worldFactory.create()
  }

  async teardown() {
    await this.worldFactory.destroy(this.world)

    messages.push({
      testCaseFinished: {
        testCaseStartedId: this.id,
        willBeRetried: false,
        timestamp: makeTimestamp(),
      },
    })
  }
}
