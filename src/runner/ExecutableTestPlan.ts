import { AssembledTestCase, AssembledTestPlan, SupportCodeLibrary } from '@cucumber/core'
import { ensure } from '@cucumber/junit-xml-formatter/dist/src/helpers.js'

import { WorldFactory } from '../support/index.js'
import { ExecutableTestCase } from './ExecutableTestCase.js'
import { MessagesCollector } from './MessagesCollector.js'

export class ExecutableTestPlan {
  private readonly testCaseByPickleId: Map<string, AssembledTestCase> = new Map()

  constructor(
    private readonly messages: MessagesCollector,
    private readonly worldFactory: WorldFactory,
    private readonly supportCodeLibrary: SupportCodeLibrary,
    private readonly plan: AssembledTestPlan
  ) {
    for (const testCase of plan.testCases) {
      this.testCaseByPickleId.set(testCase.pickleId, testCase)
    }
  }

  select(pickleId: string): ExecutableTestCase {
    const testCase = ensure(
      this.testCaseByPickleId.get(pickleId),
      'AssembledTestCase must exist for pickleId'
    )
    return new ExecutableTestCase(
      this.messages,
      this.worldFactory,
      this.supportCodeLibrary,
      testCase
    )
  }
}
