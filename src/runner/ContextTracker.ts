import { TestContext } from 'node:test'

import { Envelope } from '@cucumber/messages'

import { makeTimestamp } from '../makeTimestamp.js'
import { TestCaseContext, World } from '../types.js'
import { makeAttachment, makeLink, makeLog } from './makeAttachment.js'

export class ContextTracker {
  outcomeKnown = false

  constructor(
    private readonly testCaseStartedId: string,
    private readonly world: World,
    private readonly onMessage: (envelope: Envelope) => void
  ) {}

  makeContext(nodeTestContext: TestContext, testStepId: string): TestCaseContext {
    return {
      assert: nodeTestContext.assert,
      mock: nodeTestContext.mock,
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
        attachment.timestamp = makeTimestamp()
        attachment.testCaseStartedId = this.testCaseStartedId
        attachment.testStepId = testStepId
        this.onMessage({ attachment })
      },
      log: async (text) => {
        const attachment = await makeLog(text)
        attachment.timestamp = makeTimestamp()
        attachment.testCaseStartedId = this.testCaseStartedId
        attachment.testStepId = testStepId
        this.onMessage({ attachment })
      },
      link: async (url, title) => {
        const attachment = await makeLink(url, title)
        attachment.timestamp = makeTimestamp()
        attachment.testCaseStartedId = this.testCaseStartedId
        attachment.testStepId = testStepId
        this.onMessage({ attachment })
      },
      world: this.world,
    }
  }
}
