import { AssembledTestCase, SupportCodeLibrary } from '@cucumber/core'

import { makeTimestamp } from '../makeTimestamp.js'
import { newId } from '../newId.js'
import { WorldFactory } from '../support/index.js'
import { AttachmentsSupport, World } from '../types.js'
import { ExecutableTestStep } from './ExecutableTestStep.js'
import { makeAttachment, makeLink, makeLog } from './makeAttachment.js'
import { MessagesCollector } from './MessagesCollector.js'

export class ExecutableTestCase {
  readonly id = newId()
  outcomeKnown = false
  private attachmentsSupport?: AttachmentsSupport
  private world?: World
  private currentTestStepId?: string

  constructor(
    private readonly messages: MessagesCollector,
    private readonly worldFactory: WorldFactory,
    private readonly supportCodeLibrary: SupportCodeLibrary,
    private readonly testCase: AssembledTestCase
  ) {}

  get name() {
    return this.testCase.name
  }

  get context() {
    return {
      ...(this.attachmentsSupport as AttachmentsSupport),
      world: this.world as World,
    }
  }

  *testSteps() {
    for (const testStep of this.testCase.testSteps) {
      this.currentTestStepId = testStep.id
      yield new ExecutableTestStep(this.messages, this, this.supportCodeLibrary, testStep)
    }
  }

  async setup() {
    this.messages.push({
      testCaseStarted: {
        id: this.id,
        testCaseId: this.testCase.id,
        attempt: 0,
        timestamp: makeTimestamp(),
      },
    })

    this.attachmentsSupport = {
      attach: async (data, options) => {
        const attachment = await makeAttachment(data, options)
        attachment.testCaseStartedId = this.id
        attachment.testStepId = this.currentTestStepId
        this.messages.push({ attachment })
      },
      log: async (text) => {
        const attachment = await makeLog(text)
        attachment.testCaseStartedId = this.id
        attachment.testStepId = this.currentTestStepId
        this.messages.push({ attachment })
      },
      link: async (url, title) => {
        const attachment = await makeLink(url, title)
        attachment.testCaseStartedId = this.id
        attachment.testStepId = this.currentTestStepId
        this.messages.push({ attachment })
      },
    }
    this.world = await this.worldFactory.create(this.attachmentsSupport)
  }

  async teardown() {
    await this.worldFactory.destroy(this.world)

    this.messages.push({
      testCaseFinished: {
        testCaseStartedId: this.id,
        willBeRetried: false,
        timestamp: makeTimestamp(),
      },
    })
  }
}
