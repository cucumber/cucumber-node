import { TestContext } from 'node:test'
import { styleText } from 'node:util'

import { AssembledTestStep } from '@cucumber/core'
import { TestStepResult } from '@cucumber/messages'

import { makeTimestamp } from '../makeTimestamp.js'
import { TestCaseContext } from '../types.js'
import { ExecutableTestCase } from './ExecutableTestCase.js'
import { makeAttachment, makeLink, makeLog } from './makeAttachment.js'
import { messages } from './state.js'

export class ExecutableTestStep {
  constructor(
    private readonly parent: ExecutableTestCase,
    private readonly assembledStep: AssembledTestStep
  ) {}

  get name(): string {
    return [styleText('bold', this.assembledStep.name.prefix), this.assembledStep.name.body]
      .filter(Boolean)
      .join(' ')
  }

  get options() {
    return { skip: this.parent.outcomeKnown && !this.assembledStep.always }
  }

  async setup() {
    messages.push({
      testStepStarted: {
        testCaseStartedId: this.parent.id,
        testStepId: this.assembledStep.id,
        timestamp: makeTimestamp(),
      },
    })
  }

  async execute(nodeTestContext: TestContext) {
    let success = false
    try {
      const { fn, args } = this.assembledStep.prepare(this.parent.world)
      const context = this.makeContext(nodeTestContext)
      const returned = await fn(context, ...args)
      if (returned === 'skipped') {
        context.skip()
      } else if (returned === 'pending') {
        context.todo()
      }
      success = true
    } finally {
      if (!success) {
        this.parent.outcomeKnown = true
      }
    }
  }

  private makeContext(nodeTestContext: TestContext): TestCaseContext {
    return {
      assert: nodeTestContext.assert,
      mock: nodeTestContext.mock,
      skip: () => {
        nodeTestContext.skip()
        this.parent.outcomeKnown = true
      },
      todo: () => {
        nodeTestContext.todo()
        this.parent.outcomeKnown = true
      },
      attach: async (data, options) => {
        const attachment = await makeAttachment(data, options)
        attachment.timestamp = makeTimestamp()
        attachment.testCaseStartedId = this.parent.id
        attachment.testStepId = this.assembledStep.id
        messages.push({ attachment })
      },
      log: async (text) => {
        const attachment = await makeLog(text)
        attachment.timestamp = makeTimestamp()
        attachment.testCaseStartedId = this.parent.id
        attachment.testStepId = this.assembledStep.id
        messages.push({ attachment })
      },
      link: async (url, title) => {
        const attachment = await makeLink(url, title)
        attachment.timestamp = makeTimestamp()
        attachment.testCaseStartedId = this.parent.id
        attachment.testStepId = this.assembledStep.id
        messages.push({ attachment })
      },
      world: this.parent.world,
    }
  }

  async teardown() {
    messages.push({
      testStepFinished: {
        testCaseStartedId: this.parent.id,
        testStepId: this.assembledStep.id,
        timestamp: makeTimestamp(),
        testStepResult: {} as TestStepResult,
      },
    })
  }
}
