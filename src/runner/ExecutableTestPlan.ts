import { AssembledTestCase, AssembledTestPlan } from '@cucumber/core'
import { ensure } from '@cucumber/junit-xml-formatter/dist/src/helpers.js'

import { ExecutableTestCase } from './ExecutableTestCase.js'
import { WorldFactory } from './WorldFactory.js'

export class ExecutableTestPlan {
  private readonly testCaseByPickleId: Map<string, AssembledTestCase> = new Map()

  constructor(
    private readonly worldFactory: WorldFactory,
    private readonly plan: AssembledTestPlan
  ) {
    for (const testCase of plan.testCases) {
      this.testCaseByPickleId.set(testCase.pickleId, testCase)
    }
  }

  get name() {
    return this.plan.name
  }

  select(pickleId: string): ExecutableTestCase {
    const testCase = ensure(
      this.testCaseByPickleId.get(pickleId),
      'AssembledTestCase must exist for pickleId'
    )
    return new ExecutableTestCase(this.worldFactory, testCase)
  }
}
