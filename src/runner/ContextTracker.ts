import { TestContext } from 'node:test'

import { Envelope } from '@cucumber/messages'

import { TestCaseContext } from '../types.js'
import { makeAttachment, makeLink, makeLog } from './makeAttachment.js'

export class ContextTracker {
  outcomeKnown = false

  constructor(
    private readonly testCaseStartedId: string,
    private readonly world: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    private readonly onMessage: (envelope: Envelope) => void
  ) {}

  makeContext(nodeTestContext: TestContext, testStepId: string): TestCaseContext {
    return {
      skip: () => {
        nodeTestContext.skip()
        this.outcomeKnown = true
      },
      todo: () => {
        nodeTestContext.todo()
        this.outcomeKnown = true
      },
      attach: async (data, options) => {
        const attachment = await makeAttachment(data, options)
        attachment.testCaseStartedId = this.testCaseStartedId
        attachment.testStepId = testStepId
        this.onMessage({ attachment })
      },
      log: async (text) => {
        const attachment = await makeLog(text)
        attachment.testCaseStartedId = this.testCaseStartedId
        attachment.testStepId = testStepId
        this.onMessage({ attachment })
      },
      link: async (url, title) => {
        const attachment = await makeLink(url, title)
        attachment.testCaseStartedId = this.testCaseStartedId
        attachment.testStepId = testStepId
        this.onMessage({ attachment })
      },
      world: this.world,
    }
  }
}
