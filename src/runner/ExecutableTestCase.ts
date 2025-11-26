import { TestContext } from 'node:test'

import { AssembledTestCase } from '@cucumber/core'

import { makeTimestamp } from '../makeTimestamp.js'
import { newId } from '../newId.js'
import { AttachFunction, LinkFunction, LogFunction, World } from '../types.js'
import { ExecutableTestStep } from './ExecutableTestStep.js'
import { makeAttachment, makeLink, makeLog } from './makeAttachment.js'
import { messages } from './state.js'
import { WorldFactory } from './WorldFactory.js'

export class ExecutableTestCase {
  public readonly id = newId()
  public attach?: AttachFunction
  public log?: LogFunction
  public link?: LinkFunction
  public world?: World
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

  get context() {
    return {
      attach: this.attach as AttachFunction,
      log: this.log as LogFunction,
      link: this.link as LinkFunction,
      world: this.world as World,
    }
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

    this.attach = async (data, options) => {
      const attachment = await makeAttachment(data, options)
      attachment.timestamp = makeTimestamp()
      attachment.testCaseStartedId = this.id
      attachment.testStepId = 'TODO'
      messages.push({ attachment })
    }
    this.log = async (text) => {
      const attachment = await makeLog(text)
      attachment.timestamp = makeTimestamp()
      attachment.testCaseStartedId = this.id
      attachment.testStepId = 'TODO'
      messages.push({ attachment })
    }
    this.link = async (url, title) => {
      const attachment = await makeLink(url, title)
      attachment.timestamp = makeTimestamp()
      attachment.testCaseStartedId = this.id
      attachment.testStepId = 'TODO'
      messages.push({ attachment })
    }
    this.world = await this.worldFactory.create({
      attach: this.attach,
      log: this.log,
      link: this.link,
    })
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
